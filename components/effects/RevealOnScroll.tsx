"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "@/lib/motion";

interface RevealOnScrollProps {
  children: ReactNode;
  /** Position in a sibling group — multiplied by 100ms for the stagger delay. */
  index?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}

/**
 * Fades + lifts its children into place whenever they enter the viewport,
 * staggered by `index * 100ms` to read as sequential module initialization
 * — and fades them back out (rather than snapping away) when scrolled past
 * in either direction. Instant (no delay/offset) under prefers-reduced-motion.
 */
export default function RevealOnScroll({
  children,
  index = 0,
  className,
  as = "div",
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setRevealed(entry.isIntersecting);
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Comp = as as "div";

  return (
    <Comp
      ref={ref}
      className={className}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed
          ? "translateY(0)"
          : reducedMotion
            ? "none"
            : "translateY(12px)",
        // All-longhand transition properties (rather than the `transition`
        // shorthand alongside `transitionDelay`) — React warns when a
        // shorthand and one of its longhands are both set on the same
        // element across rerenders ("conflicting property"), since the
        // shorthand implicitly resets the longhand it doesn't mention.
        transitionProperty: reducedMotion ? "opacity" : "opacity, transform",
        transitionDuration: reducedMotion ? "0.2s" : "0.5s",
        transitionTimingFunction: reducedMotion ? "linear" : "ease",
        transitionDelay: reducedMotion ? "0ms" : `${index * 100}ms`,
      }}
    >
      {children}
    </Comp>
  );
}
