"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/motion";

type Phase = "pre" | "grow" | "hold" | "shrink" | "done";

const GROW_MS = 500;
const HOLD_MS = 200;
const SHRINK_MS = 500;
const TOTAL = 9;
const TALLY_MS = 700;
const LABEL = "систем работают прямо сейчас";

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

interface SystemsCounterProps {
  start: boolean;
  onDone?: () => void;
}

/**
 * "9 систем работают прямо сейчас". The label wipes in with the exact same
 * bar-reveal animation as the headline, starting on the same tick (`start`
 * is shared with HeroTitleReveal). Only once that wipe finishes does the
 * number itself appear, and only once the number is on screen does the
 * tally from 0 begin.
 */
export default function SystemsCounter({ start, onDone }: SystemsCounterProps) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(reducedMotion ? "done" : "pre");
  const [numberVisible, setNumberVisible] = useState(reducedMotion);
  const [count, setCount] = useState(reducedMotion ? TOTAL : 0);
  const barRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef(0);
  const startedRef = useRef(false);
  const doneFiredRef = useRef(false);

  useEffect(() => {
    if (reducedMotion) {
      if (!doneFiredRef.current) {
        doneFiredRef.current = true;
        onDone?.();
      }
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
        setNumberVisible(true);
      }
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reducedMotion]);

  // Tally only starts once the number has appeared.
  useEffect(() => {
    if (!numberVisible || reducedMotion) return;

    let n = 0;
    const stepMs = TALLY_MS / TOTAL;
    const id = window.setInterval(() => {
      n += 1;
      setCount(n);
      if (n >= TOTAL) {
        window.clearInterval(id);
        onDone?.();
      }
    }, stepMs);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numberVisible, reducedMotion]);

  if (!start && !reducedMotion) return <div className="h-6" aria-hidden="true" />;

  const showBar = !reducedMotion && phase !== "pre" && phase !== "done";

  return (
    <div className="flex items-center gap-2 text-sm text-fg-muted">
      <span
        className="decorative-loop inline-block h-2 w-2 shrink-0 rounded-full bg-[#3ddc6a]"
        style={{ animation: "status-blink 1.6s ease-in-out infinite" }}
        aria-hidden="true"
      />
      <span>
        <span
          className={numberVisible ? "text-fg-primary" : "invisible"}
          aria-hidden={!numberVisible}
        >
          {count}
        </span>{" "}
        <span className="relative inline-block">
          <span style={{ opacity: reducedMotion || phase !== "pre" ? 1 : 0 }}>
            {LABEL}
          </span>
          {showBar && (
            <span
              ref={barRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 bg-fg-primary"
              style={{ left: 0, width: 0 }}
            />
          )}
        </span>
      </span>
    </div>
  );
}
