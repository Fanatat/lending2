"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/motion";

const SIZE = 84;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Circular fill animating 0 → pct once mounted — the "posts published with zero manual edits" share. */
export default function AutoPilotRing({ pct, label }: { pct: number; label: string }) {
  const reducedMotion = useReducedMotion();
  const [animatedPct, setAnimatedPct] = useState(reducedMotion ? pct : 0);

  useEffect(() => {
    if (reducedMotion) return;
    // Double rAF: one to let the 0% state actually paint, then set the real
    // value so the stroke-dashoffset transition has something to animate
    // from instead of jumping straight to the target on mount.
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setAnimatedPct(pct));
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, [pct, reducedMotion]);

  const offset = CIRCUMFERENCE * (1 - animatedPct / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--line)"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{
              transition: reducedMotion
                ? undefined
                : "stroke-dashoffset 1.1s cubic-bezier(.16,1,.3,1)",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-fg-primary">
          {Math.round(animatedPct)}%
        </div>
      </div>
      <div className="max-w-[110px] text-center text-[9px] text-fg-muted">{label}</div>
    </div>
  );
}
