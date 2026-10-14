"use client";

/**
 * Real data source for the HP100 widget. The path is direct, with no
 * middleman repo: the browser asks `api.vanatat.ru/site/air`, which leads
 * to a bridge on the home server, which in turn reads the board's own
 * server (~/projects/health_air/airmonitor_vps.py, systemd
 * `airmonitor.service`).
 * The endpoint answers with CORS only for the site's own origins
 * (vanatat.ru, www, fanatat.github.io, vanatat.vercel.app) and caches for
 * 30 s; 502 means the board's server is down. That server is switched off
 * at night (roughly 21:00–05:30 MSK), so the last reading can be hours old.
 *
 * When the endpoint answers but the reading is old (board's server off,
 * board silent), the widget keeps showing the board's last REAL reading,
 * labelled with its timestamp — never passed off as live, never replaced
 * by made-up numbers. Only if the endpoint can't be reached at all (and
 * nothing real has been seen this visit) does it fall back to the
 * simulated source in `lib/mock/hp100.ts`, labelled "нет связи" in
 * HP100Widget.
 *
 * Response shape:
 *   { co2?, temperature?, humidity?, dust?,
 *     updated: <ISO 8601, time of the measurement itself>,
 *     history?: [{ t: <ISO 8601>, co2?, temperature?, humidity?, dust? }] }
 * `history` is the last 24 h in 15-minute buckets, oldest first; any
 * metric in a bucket may be null. It becomes the widget's 24ч graph: one
 * point per bucket that has the metric (nulls skipped), `t` = the bucket's
 * epoch ms, plus the current reading as the last point. EcgChart spaces
 * points evenly by index, the same as the demo history. Without history
 * the graph falls back to the single current point.
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
  /** Real reading, but older than STALE_AFTER_MS — the board or its server is silent. */
  stale: boolean;
  lastUpdated: number | null;
  /** The first poll has finished (either way) — "no data" now means no link, not "not asked yet". */
  checked: boolean;
}

type Listener = (snapshot: Hp100Snapshot, status: Hp100Status) => void;

const FEED_URL =
  process.env.NEXT_PUBLIC_HP100_FEED_URL ?? "https://api.vanatat.ru/site/air";

const POLL_MS = 60_000;
// `updated` is the time of the measurement itself, and a working board
// reports far more often than this, so a reading older than 20 minutes
// means the board or its server has gone quiet (e.g. the server's nightly
// downtime): it's shown as the last reading, not as live. Leaves room for
// the endpoint's 30 s cache and a missed poll or two.
const STALE_AFTER_MS = 20 * 60 * 1000;

type Reading = Partial<Record<Hp100MetricKey, number | null>>;

interface FeedPayload extends Reading {
  updated?: string;
  history?: Array<Reading & { t?: string }>;
}

/**
 * One metric's 24 h series from the endpoint's buckets: oldest first,
 * buckets without the metric skipped, the current reading appended as the
 * newest point so the graph ends where the bar does.
 */
function historyFor(
  key: Hp100MetricKey,
  buckets: FeedPayload["history"],
  current: number | undefined,
  updatedMs: number
): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  if (Array.isArray(buckets)) {
    for (const b of buckets) {
      const v = b?.[key];
      const t = typeof b?.t === "string" ? Date.parse(b.t) : NaN;
      if (typeof v === "number" && Number.isFinite(v) && !Number.isNaN(t)) {
        points.push({ t, v });
      }
    }
    points.sort((a, b) => a.t - b.t);
  }
  if (current !== undefined) {
    const last = points.at(-1);
    if (last && last.t >= updatedMs) {
      points[points.length - 1] = { t: last.t, v: current };
    } else {
      points.push({ t: updatedMs, v: current });
    }
  }
  return points;
}

class Hp100LiveSource {
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setInterval> | undefined;
  private mockUnsub: (() => void) | null = null;
  private inFlight = false;
  private snapshot: Hp100Snapshot = hp100Source.getSnapshot();
  private status: Hp100Status = { live: false, stale: false, lastUpdated: null, checked: false };

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
        const current = typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;
        const history = historyFor(def.key, payload.history, current, updatedMs);
        // No current value for this metric: its newest bucket, else the
        // middle of the normal range (as before history existed).
        const latest = current ?? history.at(-1)?.v ?? (def.min + def.normalMax) / 2;
        nextSnapshot[def.key] = {
          latest,
          history: history.length ? history : [{ t: updatedMs, v: latest }],
        };
      }

      this.snapshot = nextSnapshot;
      this.status = { live: !stale, stale, lastUpdated: updatedMs, checked: true };
      this.emit();
    } catch {
      // A failed poll after real data keeps the last real reading on screen
      // (now marked stale) instead of swapping in simulated numbers.
      if (this.status.live) {
        this.status = { ...this.status, live: false, stale: true, checked: true };
        this.emit();
      } else if (!this.status.checked) {
        this.status = { ...this.status, checked: true };
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
