"use client";

import { useEffect, useRef, useState } from "react";
import { useLabStore } from "@/lib/store";
import { useReducedMotion } from "@/lib/motion";
import { playSfx } from "@/lib/sfx";

const IDLE_MS = 50_000;
const SPEED = 150; // px/s
/** Bounces before the path is steered into a corner — enough to feel random. */
const FREE_BOUNCES = 4;
const COLORS = ["#ffc53d", "#5dc8ff", "#ff5db4", "#7dff8a", "#b18cff", "#ff8a3d"];

/**
 * Leave the page alone for a while and it falls asleep into a DVD-style
 * screensaver. Everyone has waited for the logo to hit the corner exactly
 * — here it's guaranteed: after a few free bounces the vertical speed is
 * retuned so the next horizontal wall hit lands on a vertical wall too.
 * Any input wakes the page up.
 */
export default function IdleScreensaver() {
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(false);
  const [cornerHit, setCornerHit] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);
  const markFound = useLabStore((s) => s.markFound);

  useEffect(() => {
    if (reducedMotion) return;
    let timer = 0;
    function reset() {
      window.clearTimeout(timer);
      setActive(false);
      timer = window.setTimeout(() => {
        if (document.visibilityState === "visible") setActive(true);
      }, IDLE_MS);
    }
    const events = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (!active) {
      setCornerHit(false);
      return;
    }
    const el = logoRef.current;
    if (!el) return;
    const w = window.innerWidth - el.offsetWidth;
    const h = window.innerHeight - el.offsetHeight;
    let x = Math.random() * w * 0.6 + w * 0.2;
    let y = Math.random() * h * 0.6 + h * 0.2;
    let vx = SPEED * (Math.random() < 0.5 ? -1 : 1);
    let vy = SPEED * 0.8 * (Math.random() < 0.5 ? -1 : 1);
    let bounces = 0;
    let steered = false;
    let colorIdx = 0;
    let last = performance.now();
    let raf = 0;

    function recolor() {
      colorIdx = (colorIdx + 1) % COLORS.length;
      if (el) el.style.color = COLORS[colorIdx]!;
    }

    /** Pick |vy| so y reaches a wall exactly when x does. */
    function steer() {
      const tx = (vx > 0 ? w - x : x) / Math.abs(vx);
      const toWall = vy > 0 ? h - y : y;
      // Travel d + k·h along y (k extra reflections); choose k so the new
      // speed stays closest to the current one.
      let best = toWall;
      for (let k = 0; k < 6; k++) {
        const d = toWall + k * h;
        if (Math.abs(d / tx - SPEED) < Math.abs(best / tx - SPEED)) best = d;
      }
      vy = Math.sign(vy) * (best / tx);
      steered = true;
    }

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      x += vx * dt;
      y += vy * dt;
      let hitX = false;
      let hitY = false;
      if (x <= 0 || x >= w) {
        x = Math.max(0, Math.min(w, x));
        vx = -vx;
        hitX = true;
      }
      if (y <= 0 || y >= h) {
        y = Math.max(0, Math.min(h, y));
        vy = -vy;
        hitY = true;
      }
      // With a steered path the y wall can arrive a frame early/late —
      // treat "near a y wall at the x hit" as the corner.
      if (hitX && steered && (y < 3 || y > h - 3)) hitY = true;
      if (hitX || hitY) {
        recolor();
        bounces += 1;
        if (hitX && hitY) {
          setCornerHit(true);
          markFound("corner");
          playSfx("shimmer");
          steered = false;
          bounces = 0;
        } else if (hitX && bounces >= FREE_BOUNCES && !steered) {
          steer();
        }
      }
      if (el) el.style.transform = `translate(${x}px, ${y}px)`;
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, markFound]);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] bg-black/90" aria-hidden="true">
      <div ref={logoRef} className="screensaver-logo text-sm text-accent">
        0 СОТРУДНИКОВ
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-[10px] tracking-widest text-fg-muted">
        {cornerHit ? "ПОПАЛ В УГОЛ. ТЕПЕРЬ МОЖНО И ПРОСНУТЬСЯ." : "СИСТЕМЫ РАБОТАЮТ, ДАЖЕ КОГДА ВЫ НЕ СМОТРИТЕ"}
      </div>
    </div>
  );
}
