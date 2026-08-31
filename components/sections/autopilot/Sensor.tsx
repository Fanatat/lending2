"use client";

import { useEffect, useRef, useState } from "react";
import { useHasFinePointer, useMousePosition, useReducedMotion } from "@/lib/motion";

const MAX_PUPIL_OFFSET = 7;

export default function Sensor({ blinkDelayMs }: { blinkDelayMs: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const hasFinePointer = useHasFinePointer();
  const reducedMotion = useReducedMotion();
  const pointer = useMousePosition();
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!hasFinePointer || reducedMotion) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = pointer.x - cx;
    const dy = pointer.y - cy;
    const dist = Math.hypot(dx, dy) || 1;
    const r = Math.min(MAX_PUPIL_OFFSET, dist / 12);
    setOffset({ x: (dx / dist) * r, y: (dy / dist) * r });
  }, [pointer, hasFinePointer]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="relative flex h-24 w-24 items-center justify-center rounded-full border border-line"
    >
      <div className="absolute inset-2 rounded-full border border-line" />
      <div className="absolute inset-5 rounded-full border border-line" />
      <div
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          transition: "transform 120ms ease-out",
        }}
      >
        <div
          className="decorative-loop h-4 w-4 rounded-full bg-accent"
          style={{
            animation: `sensor-blink 5.5s ease-in-out ${blinkDelayMs}ms infinite`,
          }}
        />
      </div>
    </div>
  );
}
