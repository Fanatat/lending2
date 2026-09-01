"use client";

/**
 * Real data source for the HP100 widget — polls the sensor board's own
 * server (see ~/projects/health_air/airmonitor_vps.py, systemd service
 * `airmonitor.service`, not this repo). Falls back to the deterministic
 * demo source (`lib/mock/hp100.ts`) whenever the live server is
 * unreachable, so the widget never goes blank — it shows a "демо" badge
 * instead (wired up in HP100Widget).
 *
 * Real endpoints (confirmed against the actual server code, not guessed):
 *  - GET /current        → text/plain `key=value` lines (temp, hum, pres,
 *    lux, voc, nox, pm1, pm25, pm10, co2, noise, updated=<unix seconds>).
 *    Empty value = sensor hasn't reported yet.
 *  - GET /history?hours=N → JSON array of time-bucketed averages, same
 *    field names, `timestamp` as a naive UTC string "YYYY-MM-DD HH:MM".
 *
 * TODO(founder): /current does not send Access-Control-Allow-Origin, so a
 * browser on a different origin cannot read it (silent CORS failure —
 * this file treats that the same as "server unreachable" and falls back
 * to demo). A one-line fix is staged in airmonitor_vps.py's /current
 * handler, but the service needs a restart to pick it up.
 * TODO(founder): NEXT_PUBLIC_HP100_API_URL defaults to the VPS's current
 * public IP over plain HTTP. If Lending2 ends up deployed over HTTPS,
 * browsers will block this as mixed content — needs a TLS-fronted URL
 * (or a same-origin proxy) once a real deploy target exists.
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
  live: boolean;
  lastUpdated: number | null;
}

type Listener = (snapshot: Hp100Snapshot, status: Hp100Status) => void;

const API_BASE = (
  process.env.NEXT_PUBLIC_HP100_API_URL ?? "http://178.95.117.225:8080"
).replace(/\/$/, "");

const POLL_MS = 15_000;
const HISTORY_HOURS = 24;

// Плата отдаёт pm1/pm25/pm10 (три фракции пыли), виджет показывает одну.
// PM2.5 выбран как "дыхательная" метрика: это стандартный индикатор в
// WHO/AQI для мелкодисперсной пыли, проникающей глубже в лёгкие — ближе
// к тому, о чём говорит текст блока ("CO2 и пыль невидимы"), чем PM10.
const FIELD_MAP: Record<Hp100MetricKey, string> = {
  co2: "co2",
  temperature: "temp",
  humidity: "hum",
  dust: "pm25",
};

function parseCurrent(text: string): Partial<Record<string, number>> {
  const values: Partial<Record<string, number>> = {};
  for (const line of text.split("\n")) {
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const raw = line.slice(eq + 1).trim();
    if (raw === "") continue;
    const n = Number(raw);
    if (!Number.isNaN(n)) values[key] = n;
  }
  return values;
}

interface HistoryRow {
  timestamp: string;
  [field: string]: number | string | null;
}

class Hp100LiveSource {
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setInterval> | undefined;
  private mockUnsub: (() => void) | null = null;
  private inFlight = false;
  private snapshot: Hp100Snapshot = hp100Source.getSnapshot();
  private status: Hp100Status = { live: false, lastUpdated: null };

  start() {
    if (this.timer !== undefined) return;
    hp100Source.start();
    this.mockUnsub = hp100Source.subscribe((mockSnapshot) => {
      if (!this.status.live) {
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
      const [currentRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/current`, { cache: "no-store" }),
        fetch(`${API_BASE}/history?hours=${HISTORY_HOURS}`, {
          cache: "no-store",
        }),
      ]);
      if (!currentRes.ok || !historyRes.ok) {
        throw new Error(`hp100 live: HTTP ${currentRes.status}/${historyRes.status}`);
      }
      const values = parseCurrent(await currentRes.text());
      const rows = (await historyRes.json()) as HistoryRow[];

      const nextSnapshot = {} as Hp100Snapshot;
      for (const def of HP100_METRICS) {
        const field = FIELD_MAP[def.key];
        const history: SeriesPoint[] = [];
        rows.forEach((row, i) => {
          const raw = row[field];
          if (typeof raw === "number") history.push({ t: i, v: raw });
        });
        const latestRaw = values[field];
        const latest =
          typeof latestRaw === "number"
            ? latestRaw
            : (history.at(-1)?.v ?? (def.min + def.normalMax) / 2);
        nextSnapshot[def.key] = {
          latest,
          history: history.length > 0 ? history : [{ t: 0, v: latest }],
        };
      }

      this.snapshot = nextSnapshot;
      this.status = { live: true, lastUpdated: Date.now() };
      this.emit();
    } catch {
      if (this.status.live) {
        this.status = { live: false, lastUpdated: this.status.lastUpdated };
        this.snapshot = hp100Source.getSnapshot();
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
