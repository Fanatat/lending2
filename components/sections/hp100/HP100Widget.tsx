"use client";

import { useEffect, useRef, useState } from "react";
import {
  HP100_METRICS,
  hp100Source,
  type Hp100MetricKey,
  type SeriesPoint,
} from "@/lib/mock/hp100";
import ProjectCardLink from "@/components/transitions/ProjectCardLink";

function levelFor(value: number, normalMax: number, warnMax: number) {
  if (value <= normalMax) return "normal";
  if (value <= warnMax) return "warn";
  return "critical";
}

const LEVEL_COLOR: Record<string, string> = {
  normal: "#5fd0c0",
  warn: "#ffc53d",
  critical: "#ff5d5d",
};

function EcgChart({ history }: { history: SeriesPoint[] }) {
  const values = history.map((p) => p.v);
  const min = Math.min(...values);
  const max = Math.max(...values) || 1;
  const width = 640;
  const height = 120;
  const step = width / Math.max(1, history.length - 1);

  const d = history
    .map((p, i) => {
      const x = i * step;
      const norm = max === min ? 0.5 : (p.v - min) / (max - min);
      const y = height - norm * (height - 16) - 8;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="mt-4" aria-hidden="true">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="hp100-ecg-path"
      >
        <path
          d={d}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.5}
          pathLength={1}
        />
      </svg>
    </div>
  );
}

export default function HP100Widget() {
  const [snapshot, setSnapshot] = useState(() => hp100Source.getSnapshot());
  const [selected, setSelected] = useState<Hp100MetricKey | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      hp100Source.start();
    }
    const unsub = hp100Source.subscribe(setSnapshot);
    return () => {
      unsub();
      hp100Source.stop();
    };
  }, []);

  const co2 = snapshot.co2;
  const co2Def = HP100_METRICS[0]!;
  const co2Critical = co2 && co2.latest > co2Def.warnMax;

  return (
    <div
      className="w-full max-w-sm border border-line bg-panel p-4"
      aria-label="Показатели воздуха HP100 (демо-данные)"
    >
      <div className="flex items-end justify-between gap-3">
        {HP100_METRICS.map((def) => {
          const state = snapshot[def.key];
          const pct = Math.min(
            1,
            Math.max(0, (state.latest - def.min) / (def.max - def.min))
          );
          const level = levelFor(state.latest, def.normalMax, def.warnMax);
          const isCo2Critical = def.key === "co2" && co2Critical;
          return (
            <button
              key={def.key}
              type="button"
              data-cursor="interactive"
              onClick={() =>
                setSelected((s) => (s === def.key ? null : def.key))
              }
              aria-pressed={selected === def.key}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <div className="flex h-24 w-full items-end border border-line/60 bg-void">
                <div
                  className={
                    isCo2Critical
                      ? "decorative-loop w-full"
                      : "w-full transition-[height] duration-700 ease-out"
                  }
                  style={{
                    height: `${8 + pct * 92}%`,
                    background: LEVEL_COLOR[level],
                    animation: isCo2Critical
                      ? "status-blink 0.6s steps(1) infinite"
                      : undefined,
                  }}
                />
              </div>
              <span className="text-[10px] text-fg-muted">{def.label}</span>
              <span className="text-xs text-fg-primary">
                {state.latest.toFixed(def.key === "temperature" ? 1 : 0)}
                {def.unit}
              </span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="border-t border-line pt-2">
          <div className="flex items-center justify-between text-xs text-fg-muted">
            <span>
              {HP100_METRICS.find((d) => d.key === selected)?.label} — 24ч
            </span>
          </div>
          <EcgChart history={snapshot[selected].history} />
        </div>
      )}

      <p className="mt-3 text-[10px] leading-relaxed text-fg-muted">
        Демо-данные: сервер платы HP100 ещё не подключён (см. ТЗ, раздел 7).
      </p>

      <ProjectCardLink
        href="/projects/hp100"
        ariaLabel="Открыть проект HP100 целиком"
        className="mt-3 inline-block text-[10px] text-accent"
      >
        Архитектура и лог платы →
      </ProjectCardLink>
    </div>
  );
}
