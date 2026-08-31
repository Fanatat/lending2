"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/motion";

/** Airport-board style flip when the displayed value changes. */
export default function FlipNumber({ value }: { value: string }) {
  const reducedMotion = useReducedMotion();
  const [flipping, setFlipping] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    if (reducedMotion) return;
    setFlipping(true);
    const t = window.setTimeout(() => setFlipping(false), 400);
    return () => window.clearTimeout(t);
  }, [value, reducedMotion]);

  return (
    <span
      className="inline-block tabular-nums text-fg-primary"
      style={{
        animation: flipping ? "flip-number 400ms ease" : undefined,
        transformOrigin: "center",
      }}
    >
      {value}
    </span>
  );
}
