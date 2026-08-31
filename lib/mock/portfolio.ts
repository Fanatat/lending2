"use client";

/** Demo data for the "Ол Ин" widget — see ТЗ раздел 7, реального API биржи пока нет. */

export interface PortfolioAsset {
  symbol: string;
  name: string;
  allocPct: number;
}

export interface RiskMetric {
  key: string;
  label: string;
  format: (v: number) => string;
  min: number;
  max: number;
}

export const ASSETS: PortfolioAsset[] = [
  { symbol: "BTC", name: "Bitcoin", allocPct: 42 },
  { symbol: "ETH", name: "Ethereum", allocPct: 27 },
  { symbol: "SOL", name: "Solana", allocPct: 14 },
  { symbol: "USDT", name: "Стейблы", allocPct: 11 },
  { symbol: "ALT", name: "Прочее", allocPct: 6 },
];

export const RISK_METRICS: RiskMetric[] = [
  { key: "concentration", label: "Концентрация", format: (v) => `${v.toFixed(0)}%`, min: 30, max: 55 },
  { key: "drawdown", label: "Просадка", format: (v) => `${v.toFixed(1)}%`, min: 4, max: 22 },
  { key: "liquidity", label: "Ликвидность", format: (v) => `${v.toFixed(0)}ч`, min: 1, max: 48 },
  { key: "unlocks", label: "Разлок через", format: (v) => `${v.toFixed(0)}д`, min: 2, max: 90 },
];

type Listener = (values: Record<string, number>) => void;

const UPDATE_MS = 60_000;

class PortfolioMockSource {
  private values: Record<string, number>;
  private listeners = new Set<Listener>();
  private timer: number | undefined;

  constructor() {
    this.values = Object.fromEntries(
      RISK_METRICS.map((m) => [m.key, m.min + Math.random() * (m.max - m.min)])
    );
  }

  start() {
    if (this.timer !== undefined) return;
    this.timer = window.setInterval(() => this.tick(), UPDATE_MS);
  }

  stop() {
    if (this.timer !== undefined) {
      window.clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private tick() {
    for (const m of RISK_METRICS) {
      const drift = (Math.random() - 0.5) * (m.max - m.min) * 0.2;
      this.values[m.key] = Math.min(
        m.max,
        Math.max(m.min, this.values[m.key]! + drift)
      );
    }
    this.emit();
  }

  getSnapshot() {
    return this.values;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    for (const l of this.listeners) l({ ...this.values });
  }
}

export const portfolioSource = new PortfolioMockSource();
