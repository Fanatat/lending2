"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/motion";

const SIZE = 84;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const START_DELAY_MS = 500;
const FILL_MS = 3000;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Circular fill animating 0 → pct over 3s, starting the first time the ring
 * actually scrolls into view (not on mount, which could fire off-screen
 * below the fold), after a short pause so the fill reads as a deliberate
 * beat rather than firing the instant the ring appears — the "posts
 * published with zero manual edits" share.
 */
export default function AutoPilotRing({ pct, label }: { pct: number; label: string }) {
  const reducedMotion = useReducedMotion();
  const [animatedPct, setAnimatedPct] = useState(reducedMotion ? pct : 0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(reducedMotion);

  useEffect(() => {
    if (reducedMotion) return;
    const el = containerRef.current;
    if (!el) return;

    let rafId = 0;
    let delayTimer = 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || startedRef.current) return;
        startedRef.current = true;
        observer.disconnect();

        delayTimer = window.setTimeout(() => {
          const startTime = performance.now();
          function frame(now: number) {
            const t = Math.min(1, (now - startTime) / FILL_MS);
            setAnimatedPct(easeOutCubic(t) * pct);
            if (t < 1) rafId = requestAnimationFrame(frame);
          }
          rafId = requestAnimationFrame(frame);
        }, START_DELAY_MS);
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.clearTimeout(delayTimer);
      cancelAnimationFrame(rafId);
    };
  }, [pct, reducedMotion]);

  const offset = CIRCUMFERENCE * (1 - animatedPct / 100);

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-2">
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
