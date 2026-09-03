"use client";

import { useEffect, useRef, useState } from "react";
import { useLabStore } from "@/lib/store";

const VISIBLE_MS = 10_000;
const MIN_CLICKS_TO_SHOW = 2;
const TOTAL_CLICKS = 5;

/**
 * A one-off "АНОМАЛИЯ N/5 ЗАФИКСИРОВАНА" toast under the Hero title,
 * tracking clicks toward the Hero title's 5-click matrix gesture
 * (matrixClickCount in lib/store.ts) — deliberately NOT the count of eggs
 * actually found (foundEasterEggs), which is a different number the
 * top-right tally already shows permanently.
 *
 * A single click could be an accident, so it stays quiet until the 2nd
 * click of a streak, then shows the live running count for 10s.
 *
 * The baseline is tracked by comparing the actual `matrixClickCount`
 * value (not a "have I run yet" boolean ref) specifically so React
 * StrictMode's dev-only double-invoke of this effect on mount — same
 * value both times — can never be mistaken for a real change and flash
 * the toast on page load before any click has happened.
 */
export default function AnomalyBanner() {
  const clickCount = useLabStore((s) => s.matrixClickCount);
  const [visible, setVisible] = useState(false);
  const baselineRef = useRef<number | null>(null);

  useEffect(() => {
    if (baselineRef.current === null || baselineRef.current === clickCount) {
      baselineRef.current = clickCount;
      return;
    }
    baselineRef.current = clickCount;

    if (clickCount < MIN_CLICKS_TO_SHOW) return;

    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), VISIBLE_MS);
    return () => window.clearTimeout(t);
  }, [clickCount]);

  if (!visible) return null;

  return (
    <p role="status" className="mt-1 text-[10px] tracking-widest text-accent">
      АНОМАЛИЯ {clickCount}/{TOTAL_CLICKS} ЗАФИКСИРОВАНА
    </p>
  );
}
