"use client";

import { useEffect, useRef, useState } from "react";
import { portfolioSource } from "@/lib/mock/portfolio";

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

const SEGMENTS = 10;

/**
 * Second, complementary read on the same risk metrics PortfolioWidget shows
 * as a table — a single composite "health index" with a segmented gauge,
 * so the section carries two distinct statistic presentations side by side
 * instead of one replacing the other.
 */
export default function PortfolioHealthCard() {
  const [values, setValues] = useState(() => portfolioSource.getSnapshot());
  const started = useRef(false);

  useEffect(() => {
    const unsub = portfolioSource.subscribe(setValues);
    if (!started.current) {
      started.current = true;
      portfolioSource.start();
    }
    return () => {
      unsub();
      portfolioSource.stop();
    };
  }, []);

  const concentration = values.concentration ?? 40;
  const drawdown = values.drawdown ?? 10;
  const concentrationRisk = clamp((concentration - 30) / (55 - 30), 0, 1);
  const drawdownRisk = clamp((drawdown - 4) / (22 - 4), 0, 1);
  const score = Math.round(
    clamp(100 - (concentrationRisk * 40 + drawdownRisk * 60), 0, 100)
  );
  const level = score >= 70 ? "normal" : score >= 40 ? "warn" : "critical";
  const color =
    level === "normal" ? "#5fd0c0" : level === "warn" ? "#ffc53d" : "#ff5d5d";
  const lit = Math.max(1, Math.round((score / 100) * SEGMENTS));

  return (
    <div className="w-full max-w-sm border border-line bg-panel p-5">
      <div className="text-[10px] uppercase tracking-wide text-fg-muted">
        Индекс здоровья портфеля
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span
          className="text-4xl font-bold transition-colors duration-700"
          style={{ color, textShadow: `0 0 14px ${color}` }}
        >
          {score}
        </span>
        <span className="mb-1 text-xs text-fg-muted">/ 100</span>
      </div>
      <div className="mt-3 flex gap-[3px]" aria-hidden="true">
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <div
            key={i}
            className="h-2 flex-1 transition-colors duration-700"
            style={{ background: i < lit ? color : "rgba(255,255,255,0.08)" }}
          />
        ))}
      </div>
      <ul className="mt-4 space-y-1.5 text-xs">
        <li className="flex items-center justify-between">
          <span className="text-fg-muted">Давит на индекс: концентрация</span>
          <span className="text-fg-primary">{concentration.toFixed(0)}%</span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-fg-muted">Давит на индекс: просадка</span>
          <span className="text-fg-primary">{drawdown.toFixed(1)}%</span>
        </li>
      </ul>
      <p className="mt-3 text-[10px] leading-relaxed text-fg-muted">
        Композитный индекс из тех же риск-метрик, что слева — другой срез тех
        же данных, не отдельный источник.
      </p>
    </div>
  );
}
