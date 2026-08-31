"use client";

import { useEffect, useRef } from "react";
import { useHasFinePointer, useHasMounted } from "@/lib/motion";

const INTERACTIVE_SELECTOR =
  'a, button, summary, input, [role="button"], [tabindex]:not([tabindex="-1"]), [data-cursor="interactive"]';

/**
 * Replaces the system cursor with a crosshair on interactive elements and a
 * dot otherwise, plus a short expanding-ring flash on click. Only mounts on
 * devices with a real mouse (hover:hover + pointer:fine) — touch devices
 * keep their native behaviour untouched.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringHostRef = useRef<HTMLDivElement>(null);
  const hasFinePointer = useHasFinePointer();
  const mounted = useHasMounted();

  useEffect(() => {
    if (!mounted || !hasFinePointer) return;

    document.documentElement.classList.add("custom-cursor-active");
    const dot = dotRef.current;
    const ringHost = ringHostRef.current;
    let hovering = false;

    function handleMove(e: PointerEvent) {
      if (!dot) return;
      dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
    }

    function handleOver(e: PointerEvent) {
      const target = e.target as Element | null;
      const isInteractive = !!target?.closest(INTERACTIVE_SELECTOR);
      if (isInteractive !== hovering) {
        hovering = isInteractive;
        dot?.classList.toggle("cursor-dot--interactive", hovering);
      }
    }

    function handleDown(e: PointerEvent) {
      if (!ringHost) return;
      const ring = document.createElement("div");
      ring.className = "cursor-click-ring";
      ring.style.left = `${e.clientX}px`;
      ring.style.top = `${e.clientY}px`;
      ringHost.appendChild(ring);
      ring.addEventListener("animationend", () => ring.remove(), {
        once: true,
      });
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerover", handleOver);
    window.addEventListener("pointerdown", handleDown);

    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerover", handleOver);
      window.removeEventListener("pointerdown", handleDown);
    };
  }, [mounted, hasFinePointer]);

  if (!mounted || !hasFinePointer) return null;

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringHostRef} aria-hidden="true" />
    </>
  );
}
