"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/motion";

const TOTAL = 9;
const TALLY_MS = 700;

interface SystemsCounterProps {
  start: boolean;
  onDone?: () => void;
}

/** "9 систем работают прямо сейчас" — counts up from 0, blinking status dot. */
export default function SystemsCounter({ start, onDone }: SystemsCounterProps) {
  const reducedMotion = useReducedMotion();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    if (reducedMotion) {
      setCount(TOTAL);
      onDone?.();
      return;
    }

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
  }, [start, reducedMotion]);

  if (!start) return <div className="h-6" aria-hidden="true" />;

  return (
    <div className="flex items-center gap-2 text-sm text-fg-muted">
      <span
        className="decorative-loop inline-block h-2 w-2 rounded-full bg-[#3ddc6a]"
        style={{ animation: "status-blink 1.6s ease-in-out infinite" }}
        aria-hidden="true"
      />
      <span>
        <span className="text-fg-primary">{count}</span> систем работают
        прямо сейчас
      </span>
    </div>
  );
}
