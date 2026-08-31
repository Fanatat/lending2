"use client";

import { useEffect, useRef, useState } from "react";
import ProjectCardLink from "@/components/transitions/ProjectCardLink";
import { ASSETS, RISK_METRICS, portfolioSource } from "@/lib/mock/portfolio";
import FlipNumber from "./FlipNumber";

const SLICE_SHADES = ["#ffc53d", "#e0ab2f", "#b9862a", "#8a6420", "#5c4416"];

function buildConicGradient() {
  let acc = 0;
  const stops = ASSETS.map((a, i) => {
    const start = acc;
    acc += a.allocPct;
    return `${SLICE_SHADES[i % SLICE_SHADES.length]} ${start}% ${acc}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

export default function PortfolioWidget() {
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

  return (
    <div className="w-full max-w-sm border border-line bg-panel p-5">
      <div className="border border-line px-3 py-2 text-center text-[10px] tracking-wide text-accent">
        Торговые сигналы: ОТКЛЮЧЕНЫ (Read-only)
      </div>

      <div className="mt-5 flex items-center gap-5">
        <div
          className="h-24 w-24 shrink-0 rounded-full border border-line"
          style={{ backgroundImage: buildConicGradient() }}
          aria-hidden="true"
        />
        <ul className="flex-1 space-y-1 text-xs">
          {ASSETS.map((a, i) => (
            <li key={a.symbol} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-fg-primary">
                <span
                  className="h-2 w-2 shrink-0"
                  style={{ background: SLICE_SHADES[i % SLICE_SHADES.length] }}
                  aria-hidden="true"
                />
                {a.symbol}
              </span>
              <span className="text-fg-muted">{a.allocPct}%</span>
            </li>
          ))}
        </ul>
      </div>

      <table className="mt-5 w-full border-t border-line pt-3 text-xs">
        <tbody>
          {RISK_METRICS.map((m) => (
            <tr key={m.key} className="border-b border-line/50 last:border-0">
              <td className="py-1.5 text-fg-muted">{m.label}</td>
              <td className="py-1.5 text-right">
                <FlipNumber value={m.format(values[m.key] ?? m.min)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-3 text-[10px] leading-relaxed text-fg-muted">
        Демо-данные: API биржи ещё не подключён (см. ТЗ, раздел 7).
      </p>

      <ProjectCardLink
        href="/projects/all-in"
        ariaLabel="Открыть проект Ол Ин"
        className="mt-3 inline-block text-[10px] text-accent"
      >
        Разбор логики Python-модуля →
      </ProjectCardLink>
    </div>
  );
}
