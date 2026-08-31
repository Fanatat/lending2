"use client";

import { useEffect, useState } from "react";

/**
 * Tracks prefers-reduced-motion live (not just at mount), so components can
 * pick a simplified variant of a functional animation instead of disabling
 * animation wholesale. Purely decorative loops should instead use the
 * `.decorative-loop` CSS class in globals.css.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, []);

  return reduced;
}

/** True once mounted on the client — guards effects that must not run during SSR. */
export function useHasMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/** rAF-throttled global pointer position, for cursor-following effects (sensors, avatar pupils). */
export function useMousePosition() {
  const [pos, setPos] = useState({ x: -9999, y: -9999 });

  useEffect(() => {
    let rafId = 0;
    let pending: { x: number; y: number } | null = null;

    function onMove(e: PointerEvent) {
      pending = { x: e.clientX, y: e.clientY };
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          if (pending) setPos(pending);
          rafId = 0;
        });
      }
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return pos;
}

/** True on devices with a real pointer (mouse) — gates cursor-following effects. */
export function useHasFinePointer(): boolean {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(hover: hover) and (pointer: fine)");
    setFine(mql.matches);
    const listener = (e: MediaQueryListEvent) => setFine(e.matches);
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, []);
  return fine;
}
