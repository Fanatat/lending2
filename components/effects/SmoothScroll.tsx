"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { useReducedMotion } from "@/lib/motion";

/**
 * Inertial "soft" scroll — the page settles with a bit of trailing motion
 * instead of snapping under the wheel/trackpad. Lenis keeps `window.scrollY`
 * in sync every frame, so ScrollProgress, RevealOnScroll's
 * IntersectionObserver and everything else that reads native scroll state
 * keeps working unmodified. Off entirely under prefers-reduced-motion.
 */
export default function SmoothScroll() {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    });

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [reducedMotion]);

  return null;
}
