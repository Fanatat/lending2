"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/motion";
import { useLabStore } from "@/lib/store";

type Phase = "pre" | "grow" | "hold" | "shrink" | "done";

const GROW_MS = 500;
const HOLD_MS = 200;
const SHRINK_MS = 500;
const INITIAL_DELAY_MS = 250;

const CLICK_RESET_GAP_MS = 1000;
const CLICKS_TO_TOGGLE = 5;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

interface HeroTitleRevealProps {
  text: string;
  onRevealed?: () => void;
}

/**
 * "Не резюме..." headline reveal: a rectangle grows left-to-right to the
 * text's right edge, holds 0.2s, then narrows away from the left (right
 * edge pinned) while the text underneath wipes into view along the same
 * edge — both driven by one rAF tween so they stay perfectly in sync. Five
 * quick clicks (gap <=1s between each) toggle Matrix mode.
 */
export default function HeroTitleReveal({
  text,
  onRevealed,
}: HeroTitleRevealProps) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(reducedMotion ? "done" : "pre");
  const barRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef(0);
  const clickCountRef = useRef(0);
  const lastClickRef = useRef(0);
  const matrixMode = useLabStore((s) => s.matrixMode);
  const setMatrixMode = useLabStore((s) => s.setMatrixMode);
  const markFound = useLabStore((s) => s.markFound);

  // Phase sequencing.
  useEffect(() => {
    if (reducedMotion) {
      onRevealed?.();
      return;
    }
    const t1 = window.setTimeout(() => setPhase("grow"), INITIAL_DELAY_MS);
    return () => window.clearTimeout(t1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion || phase === "pre" || phase === "done") return;

    if (phase === "hold") {
      const t = window.setTimeout(() => setPhase("shrink"), HOLD_MS);
      return () => window.clearTimeout(t);
    }

    const duration = phase === "grow" ? GROW_MS : SHRINK_MS;
    const start = performance.now();

    function frame(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOutCubic(t);
      const bar = barRef.current;
      const textEl = textRef.current;

      if (phase === "grow" && bar) {
        bar.style.left = "0%";
        bar.style.width = `${eased * 100}%`;
      } else if (phase === "shrink") {
        if (bar) {
          bar.style.left = `${eased * 100}%`;
          bar.style.width = `${(1 - eased) * 100}%`;
        }
        if (textEl) {
          textEl.style.clipPath = `inset(0 ${(1 - eased) * 100}% 0 0)`;
        }
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
  const initialClip = reducedMotion || phase === "done" ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)";

  return (
    <h1
      onClick={handleClick}
      data-cursor="interactive"
      className="hero-title relative inline-block max-w-3xl select-none text-3xl leading-tight text-fg-primary sm:text-4xl md:text-5xl"
    >
      <span
        ref={textRef}
        style={{
          clipPath: initialClip,
          opacity: reducedMotion || phase !== "pre" ? 1 : 0,
        }}
      >
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
