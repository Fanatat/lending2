"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTransitionStore } from "@/lib/transitionStore";

/**
 * Fixed overlay that expands from a clicked card's rect to fill the
 * viewport, then fades out once the new route has mounted underneath it.
 * Lives once in the root layout so it survives the client-side navigation.
 */
export default function ProjectTransitionOverlay() {
  const active = useTransitionStore((s) => s.active);
  const rect = useTransitionStore((s) => s.rect);
  const reset = useTransitionStore((s) => s.reset);
  const pathname = usePathname();
  const boxRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (!active || !rect) {
      setExpanded(false);
      return;
    }
    const box = boxRef.current;
    if (box) {
      box.style.transition = "none";
      box.style.top = `${rect.top}px`;
      box.style.left = `${rect.left}px`;
      box.style.width = `${rect.width}px`;
      box.style.height = `${rect.height}px`;
      // force reflow so the next style change animates
      void box.offsetHeight;
      box.style.transition = "top 550ms ease, left 550ms ease, width 550ms ease, height 550ms ease";
    }
    const raf = requestAnimationFrame(() => setExpanded(true));
    return () => cancelAnimationFrame(raf);
  }, [active, rect]);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      if (active) {
        const t = window.setTimeout(reset, 200);
        return () => window.clearTimeout(t);
      }
    }
  }, [pathname, active, reset]);

  if (!active || !rect) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] bg-void/80" aria-hidden="true">
      <div
        ref={boxRef}
        className="absolute bg-void"
        style={
          expanded
            ? { top: 0, left: 0, width: "100vw", height: "100vh" }
            : {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
              }
        }
      />
    </div>
  );
}
