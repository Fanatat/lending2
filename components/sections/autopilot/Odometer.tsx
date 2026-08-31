"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/motion";

function OdometerDigit({ digit, animate }: { digit: number; animate: boolean }) {
  return (
    <span className="relative inline-block h-[1.2em] w-[0.62em] overflow-hidden align-bottom">
      <span
        className="absolute left-0 top-0 flex flex-col"
        style={{
          transform: `translateY(-${digit * 1.2}em)`,
          transition: animate ? "transform 500ms ease-out" : "none",
        }}
      >
        {Array.from({ length: 10 }).map((_, d) => (
          <span key={d} className="block h-[1.2em] leading-[1.2em]">
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

/** Mechanical odometer roll — used for "Дней без сбоев". */
export default function Odometer({ value }: { value: number }) {
  const reducedMotion = useReducedMotion();
  const target = Math.max(0, Math.floor(value));
  const [displayed, setDisplayed] = useState(reducedMotion ? target : 0);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayed(target);
      return;
    }
    const t = window.setTimeout(() => setDisplayed(target), 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, reducedMotion]);

  const shown = String(displayed).padStart(String(target).length, "0");

  return (
    <span className="inline-flex text-2xl tabular-nums text-accent">
      {shown.split("").map((ch, i) => (
        <OdometerDigit key={i} digit={Number(ch)} animate={!reducedMotion} />
      ))}
    </span>
  );
}
