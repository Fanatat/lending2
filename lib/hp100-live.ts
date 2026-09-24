"use client";

/**
 * Real data source for the HP100 widget. The board's own server
 * (~/projects/health_air/airmonitor_vps.py, systemd service
 * `airmonitor.service`) only answers reliably on the VPS's own network —
 * the public IP once used to reach it directly is a proxy with a single
 * unrelated port forwarded, isn't reliably reachable from a visitor's
 * browser, and is being retired regardless. So instead, a separate bot
 * (~/projects/hp100-live-feed/update_feed.py, run standalone or via
 * systemd, not this repo) polls that local server every 5 minutes and
 * publishes the latest reading as JSON to a public GitHub repo; this file
 * fetches that repo's raw.githubusercontent.com URL, which is always
 * reachable from any browser with no CORS or mixed-content concerns.
 *
 * When the feed is reachable but stale (the bot stopped pushing), the
 * widget keeps showing the board's last REAL reading, labelled with its
 * timestamp — never passed off as live, never replaced by made-up numbers.
 * Only if the feed can't be fetched at all (and nothing real has been seen
 * this visit) does it fall back to the simulated source in
 * `lib/mock/hp100.ts`, labelled as "нет связи" in HP100Widget.
 *
 * Feed shape (see update_feed.py's `build_payload`):
 *   { co2?, temperature?, humidity?, dust?, updated: <ISO 8601 string> }
 * Only one point at a time — no rolling history from this source yet, so
 * the widget's 24ч graph shows a single point in live mode.
 */

import {
  HP100_METRICS,
  hp100Source,
  type Hp100MetricKey,
  type SeriesPoint,
} from "@/lib/mock/hp100";

interface MetricState {
  latest: number;
  history: SeriesPoint[];
}

export type Hp100Snapshot = Record<Hp100MetricKey, MetricState>;

export interface Hp100Status {
  /** Fresh reading from the board (younger than STALE_AFTER_MS). */
  live: boolean;
  /** Real reading, but older than STALE_AFTER_MS — the feed bot is down. */
  stale: boolean;
  lastUpdated: number | null;
}

type Listener = (snapshot: Hp100Snapshot, status: Hp100Status) => void;

const FEED_URL =
  process.env.NEXT_PUBLIC_HP100_FEED_URL ??
  "https://raw.githubusercontent.com/Fanatat/hp100-live-feed/master/latest.json";

const POLL_MS = 60_000;
// If the bot hasn't pushed a fresher reading than this, the feed counts as
// stale (bot down, GitHub raw CDN serving an old cached copy, etc.) and we
// fall back to demo rather than label old numbers "live". Comfortably
// covers a couple of missed 5-minute cycles plus CDN lag.
const STALE_AFTER_MS = 20 * 60 * 1000;

interface FeedPayload {
  co2?: number;
  temperature?: number;
  humidity?: number;
  dust?: number;
  updated?: string;
}

class Hp100LiveSource {
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setInterval> | undefined;
  private mockUnsub: (() => void) | null = null;
  private inFlight = false;
  private snapshot: Hp100Snapshot = hp100Source.getSnapshot();
  private status: Hp100Status = { live: false, stale: false, lastUpdated: null };

  start() {
    if (this.timer !== undefined) return;
    hp100Source.start();
    this.mockUnsub = hp100Source.subscribe((mockSnapshot) => {
      if (!this.status.live && !this.status.stale) {
        this.snapshot = mockSnapshot;
        this.emit();
      }
    });
    void this.poll();
    this.timer = setInterval(() => void this.poll(), POLL_MS);
  }

  stop() {
    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    this.mockUnsub?.();
    this.mockUnsub = null;
    hp100Source.stop();
  }

  private async poll() {
    if (this.inFlight) return;
    this.inFlight = true;
    try {
      const res = await fetch(FEED_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`hp100 feed: HTTP ${res.status}`);
      const payload = (await res.json()) as FeedPayload;

      const updatedMs = payload.updated ? Date.parse(payload.updated) : NaN;
      if (Number.isNaN(updatedMs)) throw new Error("hp100 feed: no timestamp");
      const stale = Date.now() - updatedMs > STALE_AFTER_MS;

      const nextSnapshot = {} as Hp100Snapshot;
      for (const def of HP100_METRICS) {
        const raw = payload[def.key];
        const latest = typeof raw === "number" ? raw : (def.min + def.normalMax) / 2;
        nextSnapshot[def.key] = { latest, history: [{ t: 0, v: latest }] };
      }

      this.snapshot = nextSnapshot;
      this.status = { live: !stale, stale, lastUpdated: updatedMs };
      this.emit();
    } catch {
      // A failed poll after real data keeps the last real reading on screen
      // (now marked stale) instead of swapping in simulated numbers.
      if (this.status.live) {
        this.status = { live: false, stale: true, lastUpdated: this.status.lastUpdated };
        this.emit();
      }
    } finally {
      this.inFlight = false;
    }
  }

  /** Console easter egg hook: simulate('co2', 2000). Works in both live and demo mode. */
  simulate(key: Hp100MetricKey, value: number) {
    const def = HP100_METRICS.find((d) => d.key === key);
    if (!def) return;
    const clamped = Math.min(def.max, Math.max(def.min, value));
    const state = this.snapshot[key];
    const history = [
      ...state.history.slice(1),
      { t: (state.history.at(-1)?.t ?? 0) + 1, v: clamped },
    ];
    this.snapshot = { ...this.snapshot, [key]: { latest: clamped, history } };
    this.emit();
  }

  getSnapshot() {
    return this.snapshot;
  }

  getStatus() {
    return this.status;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    for (const l of this.listeners) l(this.snapshot, this.status);
  }
}

export const hp100LiveSource = new Hp100LiveSource();

if (typeof window !== "undefined") {
  const w = window as unknown as { __lab?: Record<string, unknown> };
  w.__lab = {
    ...w.__lab,
    simulate: (key: Hp100MetricKey, value: number) =>
      hp100LiveSource.simulate(key, value),
  };
}
