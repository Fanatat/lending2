"use client";

import { useEffect, useRef, useState } from "react";
import { HP100_METRICS, type Hp100MetricKey, type SeriesPoint } from "@/lib/mock/hp100";
import { hp100LiveSource } from "@/lib/hp100-live";
import ProjectCardLink from "@/components/transitions/ProjectCardLink";
import { useReducedMotion } from "@/lib/motion";

type Level = "normal" | "warn" | "critical";

function levelFor(value: number, normalMax: number, warnMax: number): Level {
  if (value <= normalMax) return "normal";
  if (value <= warnMax) return "warn";
  return "critical";
}

const LEVEL_COLOR: Record<Level, string> = {
  normal: "#5fd0c0",
  warn: "#ffc53d",
  critical: "#ff5d5d",
};

/** Thin horizontal bar with the label/value row above it. */
function HorizontalBar({
  label,
  value,
  pct,
  color,
  blinking,
}: {
  label: string;
  value: string;
  pct: number;
  color: string;
  blinking?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px] text-fg-muted">
        <span>{label}</span>
        <span className="text-xs" style={{ color: blinking ? color : "var(--fg-primary)" }}>
          {value}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden bg-void">
        <div
          className={blinking ? "decorative-loop h-full" : "h-full transition-[width] duration-700 ease-out"}
          style={{
            width: `${8 + pct * 92}%`,
            background: color,
            animation: blinking ? "status-blink 0.6s steps(1) infinite" : undefined,
          }}
        />
      </div>
    </div>
  );
}

/**
 * Oscilloscope-style trace that redraws itself whenever fresh history comes
 * in (poll cadence: hp100LiveSource, ~15s) — a stroke-dashoffset reveal
 * replayed via a `key` remount on the path, rather than a single static
 * line — plus a small pulsing dot marking the most recent reading. Recolors
 * red when the selected metric is outside its normal range (no
 * whole-chart blink; the color change plus the warning line below carry
 * that on their own).
 */
function EcgChart({ history, level }: { history: SeriesPoint[]; level: Level }) {
  const reducedMotion = useReducedMotion();
  const values = history.map((p) => p.v);
  const min = Math.min(...values);
  const max = Math.max(...values) || 1;
  const width = 640;
  const height = 120;
  const step = width / Math.max(1, history.length - 1);

  const points = history.map((p, i) => {
    const x = i * step;
    const norm = max === min ? 0.5 : (p.v - min) / (max - min);
    const y = height - norm * (height - 16) - 8;
    return { x, y };
  });
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const tail = points.at(-1);

  const deviated = level !== "normal";
  const color = deviated ? LEVEL_COLOR.critical : "var(--accent)";

  return (
    <div className="mt-4" aria-hidden="true">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <path
          key={d}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          pathLength={1}
          className={reducedMotion ? undefined : "hp100-ecg-draw"}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
        {tail && (
          <circle
            cx={tail.x}
            cy={tail.y}
            r={3.5}
            fill={color}
            className={reducedMotion ? undefined : "decorative-loop"}
            style={
              reducedMotion ? undefined : { animation: "status-blink 1.2s ease-in-out infinite" }
            }
          />
        )}
      </svg>
    </div>
  );
}

export default function HP100Widget() {
  const [snapshot, setSnapshot] = useState(() => hp100LiveSource.getSnapshot());
  const [status, setStatus] = useState(() => hp100LiveSource.getStatus());
  const [selected, setSelected] = useState<Hp100MetricKey | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      hp100LiveSource.start();
    }
    const unsub = hp100LiveSource.subscribe((snap, st) => {
      setSnapshot(snap);
      setStatus(st);
    });
    return () => {
      unsub();
      hp100LiveSource.stop();
    };
  }, []);

  const co2 = snapshot.co2;
  const co2Def = HP100_METRICS[0]!;
  const co2Critical = co2 && co2.latest > co2Def.warnMax;

  const selectedDef = selected ? HP100_METRICS.find((d) => d.key === selected) : null;
  const selectedLevel =
    selected && selectedDef
      ? levelFor(snapshot[selected].latest, selectedDef.normalMax, selectedDef.warnMax)
      : "normal";

  return (
    <div
      className="w-full max-w-sm border border-line bg-panel p-4"
      aria-label={`Показатели воздуха HP100 (${status.live ? "живые данные" : "демо-данные"})`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-fg-muted">
          HP100
        </span>
        <span
          className={
            status.live
              ? "border border-accent/60 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-accent"
              : "border border-line/60 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-fg-muted"
          }
        >
          {status.live ? "live" : "демо"}
        </span>
      </div>

      <div className="space-y-3">
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
              className="block w-full text-left"
            >
              <HorizontalBar
                label={def.label}
                value={`${state.latest.toFixed(def.key === "temperature" ? 1 : 0)}${def.unit}`}
                pct={pct}
                color={LEVEL_COLOR[level]}
                blinking={isCo2Critical}
              />
            </button>
          );
        })}
      </div>

      {co2Critical && (
        <p className="mt-3 text-[10px] uppercase tracking-wide text-[#ff5d5d]">
          Вентиляция: требуется приток // CO2 выше порога
        </p>
      )}

      {selected && (
        <div className="mt-3 border-t border-line pt-2">
          <div className="flex items-center justify-between text-xs text-fg-muted">
            <span>
              {selectedDef?.label} — 24ч
              {selectedLevel !== "normal" && (
                <span className="ml-2 text-[#ff5d5d]">— отклонение от нормы</span>
              )}
            </span>
          </div>
          <EcgChart history={snapshot[selected].history} level={selectedLevel} />
        </div>
      )}

      <p className="mt-3 text-[10px] leading-relaxed text-fg-muted">
        {status.live
          ? "Живые данные с платы HP100."
          : "Демо-данные: сервер платы HP100 сейчас недоступен, показан резервный сценарий."}
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
