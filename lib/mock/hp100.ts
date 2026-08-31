"use client";

/**
 * Demo data source for the HP100 widget (see ТЗ раздел 7 — реальных
 * эндпоинтов пока нет). Produces a plausible wandering value per metric plus
 * a rolling history, ticking on a compressed synthetic timeline (each tick
 * = one "hour" of history) so the 24h chart fills up quickly for demo
 * purposes rather than requiring an actual day of uptime.
 */

export type Hp100MetricKey = "co2" | "temperature" | "humidity" | "dust";

export interface Hp100MetricDef {
  key: Hp100MetricKey;
  label: string;
  unit: string;
  min: number;
  max: number;
  normalMax: number;
  warnMax: number;
}

export const HP100_METRICS: Hp100MetricDef[] = [
  { key: "co2", label: "CO2", unit: "ppm", min: 400, max: 2200, normalMax: 800, warnMax: 1000 },
  { key: "temperature", label: "Темп.", unit: "°C", min: 18, max: 30, normalMax: 25, warnMax: 27 },
  { key: "humidity", label: "Влажн.", unit: "%", min: 25, max: 70, normalMax: 55, warnMax: 62 },
  { key: "dust", label: "Пыль", unit: "µg/m³", min: 5, max: 90, normalMax: 35, warnMax: 55 },
];

export interface SeriesPoint {
  t: number;
  v: number;
}

interface MetricState {
  latest: number;
  history: SeriesPoint[];
}

const HISTORY_LENGTH = 24;
const TICK_MS = 4000;

function seedHistory(def: Hp100MetricDef): SeriesPoint[] {
  const mid = (def.min + def.normalMax) / 2;
  const points: SeriesPoint[] = [];
  let v = mid;
  for (let i = 0; i < HISTORY_LENGTH; i++) {
    v += (Math.random() - 0.5) * (def.max - def.min) * 0.06;
    v = Math.min(def.max, Math.max(def.min, v));
    points.push({ t: i, v });
  }
  return points;
}

type Listener = (states: Record<Hp100MetricKey, MetricState>) => void;

class Hp100MockSource {
  private states: Record<Hp100MetricKey, MetricState>;
  private listeners = new Set<Listener>();
  private timer: number | undefined;
  private overrides: Partial<Record<Hp100MetricKey, number>> = {};

  constructor() {
    this.states = Object.fromEntries(
      HP100_METRICS.map((def) => {
        const history = seedHistory(def);
        return [def.key, { latest: history[history.length - 1]!.v, history }];
      })
    ) as Record<Hp100MetricKey, MetricState>;
  }

  start() {
    if (this.timer !== undefined) return;
    this.timer = window.setInterval(() => this.tick(), TICK_MS);
  }

  stop() {
    if (this.timer !== undefined) {
      window.clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private tick() {
    for (const def of HP100_METRICS) {
      const state = this.states[def.key];
      const override = this.overrides[def.key];
      let next: number;
      if (override !== undefined) {
        next = override;
        delete this.overrides[def.key];
      } else {
        const drift = (Math.random() - 0.5) * (def.max - def.min) * 0.05;
        next = Math.min(def.max, Math.max(def.min, state.latest + drift));
      }
      const history = [...state.history.slice(1), { t: state.history[state.history.length - 1]!.t + 1, v: next }];
      this.states[def.key] = { latest: next, history };
    }
    this.emit();
  }

  /** Console easter egg hook: simulate('co2', 2000). */
  simulate(key: Hp100MetricKey, value: number) {
    this.overrides[key] = value;
    const def = HP100_METRICS.find((d) => d.key === key);
    if (!def) return;
    const clamped = Math.min(def.max, Math.max(def.min, value));
    const state = this.states[key];
    const history = [...state.history.slice(1), { t: state.history[state.history.length - 1]!.t + 1, v: clamped }];
    this.states[key] = { latest: clamped, history };
    this.emit();
  }

  getSnapshot() {
    return this.states;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    for (const l of this.listeners) l({ ...this.states });
  }
}

export const hp100Source = new Hp100MockSource();

if (typeof window !== "undefined") {
  const w = window as unknown as { __lab?: Record<string, unknown> };
  w.__lab = {
    ...w.__lab,
    simulate: (key: Hp100MetricKey, value: number) => hp100Source.simulate(key, value),
  };
}
