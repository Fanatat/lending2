"use client";

import { useEffect, useRef, useState } from "react";

const SECTION_IDS = [
  "hero",
  "friday-studio",
  "hp100",
  "channel-autopilot",
  "bridge",
  "all-in",
  "content-factory",
  "staff",
  "perimeter",
  "closing",
];

interface Tick {
  id: string;
  pct: number;
}

/**
 * Thin vertical line pinned to the left edge (desktop only, lg+) that fills
 * top-down with scroll progress, with a tick at each section boundary — the
 * one for the section currently centered in the viewport lights up. Purely
 * decorative: no labels, no hover, doesn't act as a navigation control.
 */
export default function TrunkNav() {
  const fillRef = useRef<HTMLDivElement>(null);
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Tick positions, as a % down the scrollable range — recomputed on resize
  // and once more shortly after mount in case web fonts nudge layout.
  useEffect(() => {
    function measure() {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const next: Tick[] = [];
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        next.push({
          id,
          pct: Math.min(100, Math.max(0, (top / scrollable) * 100)),
        });
      }
      setTicks(next);
    }
    measure();
    window.addEventListener("resize", measure);
    const t = window.setTimeout(measure, 500);
    return () => {
      window.removeEventListener("resize", measure);
      window.clearTimeout(t);
    };
  }, []);

  // Fill height, driven directly by scroll position (same math as ScrollProgress).
  useEffect(() => {
    let rafId = 0;
    let ticking = false;

    function update() {
      ticking = false;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const pct = scrollable > 0 ? doc.scrollTop / scrollable : 0;
      if (fillRef.current) {
        fillRef.current.style.transform = `scaleY(${pct})`;
      }
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      rafId = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Active section = whichever one currently spans the viewport's vertical center.
  useEffect(() => {
    const elements = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => !!el
    );
    if (elements.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (ticks.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-y-0 left-3 z-40 hidden w-px lg:block"
    >
      <div className="absolute inset-0 bg-line" />
      <div
        ref={fillRef}
        className="absolute inset-0 origin-top bg-accent"
        style={{ transform: "scaleY(0)" }}
      />
      {ticks.map((tick) => {
        const active = tick.id === activeId;
        return (
          <span
            key={tick.id}
            className="absolute -left-1 h-px transition-all duration-300"
            style={{
              top: `${tick.pct}%`,
              width: active ? "12px" : "6px",
              background: active ? "var(--accent)" : "var(--fg-muted)",
            }}
          />
        );
      })}
    </div>
  );
}
