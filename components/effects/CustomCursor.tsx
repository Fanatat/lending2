"use client";

import { useEffect, useRef } from "react";
import { useHasFinePointer, useHasMounted } from "@/lib/motion";

const INTERACTIVE_SELECTOR =
  'a, button, summary, input, [role="button"], [tabindex]:not([tabindex="-1"]), [data-cursor="interactive"]';

// How much of the remaining distance to the pointer each element closes per
// frame — a light lerp so they trail the real pointer with a touch of glide
// instead of snapping to it 1:1 every pointermove. The ring lags further
// behind than the dot, reading as a halo the dot is dragging along with it.
const DOT_CATCH_UP = 0.35;
const RING_CATCH_UP = 0.14;

/**
 * Replaces the system cursor with a dot plus a slower-trailing ring around
 * it (a crosshair on interactive elements instead), plus a short
 * expanding-ring flash on click. Only mounts on devices with a real mouse
 * (hover:hover + pointer:fine) — touch devices keep their native behaviour
 * untouched.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const ringHostRef = useRef<HTMLDivElement>(null);
  const hasFinePointer = useHasFinePointer();
  const mounted = useHasMounted();

  useEffect(() => {
    if (!mounted || !hasFinePointer) return;

    document.documentElement.classList.add("custom-cursor-active");
    const dot = dotRef.current;
    const ring = ringRef.current;
    const ringHost = ringHostRef.current;
    let hovering = false;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let dotX = targetX;
    let dotY = targetY;
    let ringX = targetX;
    let ringY = targetY;
    let primed = false;
    let rafId = 0;

    function handleMove(e: PointerEvent) {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!primed) {
        primed = true;
        dotX = targetX;
        dotY = targetY;
        ringX = targetX;
        ringY = targetY;
      }
    }

    function frame() {
      dotX += (targetX - dotX) * DOT_CATCH_UP;
      dotY += (targetY - dotY) * DOT_CATCH_UP;
      ringX += (targetX - ringX) * RING_CATCH_UP;
      ringY += (targetY - ringY) * RING_CATCH_UP;
      if (dot) {
        dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
      }
      if (ring) {
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }
      rafId = requestAnimationFrame(frame);
    }

    function handleOver(e: PointerEvent) {
      const target = e.target as Element | null;
      const isInteractive = !!target?.closest(INTERACTIVE_SELECTOR);
      if (isInteractive !== hovering) {
        hovering = isInteractive;
        dot?.classList.toggle("cursor-dot--interactive", hovering);
        ring?.classList.toggle("cursor-ring--interactive", hovering);
      }
    }

    function handleDown(e: PointerEvent) {
      if (!ringHost) return;
      const flash = document.createElement("div");
      flash.className = "cursor-click-ring";
      flash.style.left = `${e.clientX}px`;
      flash.style.top = `${e.clientY}px`;
      ringHost.appendChild(flash);
      flash.addEventListener("animationend", () => flash.remove(), {
        once: true,
      });
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerover", handleOver);
    window.addEventListener("pointerdown", handleDown);
    rafId = requestAnimationFrame(frame);

    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerover", handleOver);
      window.removeEventListener("pointerdown", handleDown);
      cancelAnimationFrame(rafId);
    };
  }, [mounted, hasFinePointer]);

  if (!mounted || !hasFinePointer) return null;

  return (
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringHostRef} aria-hidden="true" />
    </>
  );
}
