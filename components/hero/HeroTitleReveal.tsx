"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/motion";
import { useLabStore } from "@/lib/store";

type Phase = "pre" | "grow" | "hold" | "shrink" | "done";

const GROW_MS = 500;
const HOLD_MS = 200;
const SHRINK_MS = 500;

const CLICK_RESET_GAP_MS = 1000;
const CLICKS_TO_TOGGLE = 5;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

interface HeroTitleRevealProps {
  text: string;
  start: boolean;
  onRevealed?: () => void;
}

/**
 * "Не резюме..." headline reveal: a rectangle grows left-to-right to the
 * text's right edge, holds 0.2s, then narrows away from the left (right
 * edge pinned) while the text underneath wipes into view along the same
 * edge — both driven by one rAF tween so they stay perfectly in sync.
 * `start` is owned by Hero so this and SystemsCounter's label wipe fire on
 * the exact same tick. Five quick clicks (gap <=1s between each) toggle
 * Matrix mode.
 */
export default function HeroTitleReveal({
  text,
  start,
  onRevealed,
}: HeroTitleRevealProps) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(reducedMotion ? "done" : "pre");
  const barRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef(0);
  const startedRef = useRef(false);
  const clickCountRef = useRef(0);
  const lastClickRef = useRef(0);
  const matrixMode = useLabStore((s) => s.matrixMode);
  const setMatrixMode = useLabStore((s) => s.setMatrixMode);
  const markFound = useLabStore((s) => s.markFound);

  // Kick off the grow phase once `start` flips true (reduced-motion users
  // get the full text immediately, independent of that gate).
  useEffect(() => {
    if (reducedMotion) {
      onRevealed?.();
      return;
    }
    if (!start || startedRef.current) return;
    startedRef.current = true;
    setPhase("grow");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || phase === "pre" || phase === "done") return;

    if (phase === "hold") {
      const t = window.setTimeout(() => setPhase("shrink"), HOLD_MS);
      return () => window.clearTimeout(t);
    }

    const duration = phase === "grow" ? GROW_MS : SHRINK_MS;
    const startTime = performance.now();

    function frame(now: number) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = easeOutCubic(t);
      const bar = barRef.current;

      if (phase === "grow" && bar) {
        bar.style.left = "0%";
        bar.style.width = `${eased * 100}%`;
      } else if (phase === "shrink" && bar) {
        bar.style.left = `${eased * 100}%`;
        bar.style.width = `${(1 - eased) * 100}%`;
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else if (phase === "grow") {
        setPhase("hold");
      } else if (phase === "shrink") {
        setPhase("done");
        onRevealed?.();
      }
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reducedMotion]);

  function handleClick() {
    const now = Date.now();
    if (now - lastClickRef.current > CLICK_RESET_GAP_MS) {
      clickCountRef.current = 0;
    }
    clickCountRef.current += 1;
    lastClickRef.current = now;

    if (clickCountRef.current >= CLICKS_TO_TOGGLE) {
      clickCountRef.current = 0;
      const next = !matrixMode;
      setMatrixMode(next);
      if (next) markFound("matrix");
    }
  }

  const showBar = !reducedMotion && phase !== "pre" && phase !== "done";

  return (
    <h1
      onClick={handleClick}
      data-cursor="interactive"
      className="hero-title relative inline-block max-w-3xl select-none text-3xl leading-tight text-fg-primary sm:text-4xl md:text-5xl"
    >
      <span style={{ opacity: reducedMotion || phase !== "pre" ? 1 : 0 }}>
        {text}
      </span>

      {showBar && (
        <span
          ref={barRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 bg-fg-primary"
          style={{ left: 0, width: 0 }}
        />
      )}
    </h1>
  );
}
