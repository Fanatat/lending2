"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/motion";
import { FACTORY_STAGES, IMAGES_STAGE_PROGRESS } from "./stages";

const LAP_MS = 8000;
const SLOW_MULTIPLIER = 0.3;
const THUMBS = 12;

export default function ConveyorBelt() {
  const reducedMotion = useReducedMotion();
  const boxRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);
  const [burstKey, setBurstKey] = useState(0);
  const [canScroll, setCanScroll] = useState(false);
  const hoveredRef = useRef<number | null>(null);
  hoveredRef.current = hoveredStage;

  // The belt only needs the swipe hint when the track genuinely doesn't fit
  // its container — that happens on real mobile widths, but also on some
  // in-between desktop windows once the two-column layout kicks in, so this
  // is measured rather than tied to a single fixed breakpoint.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setCanScroll(el.scrollWidth > el.clientWidth + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    let progress = 0;
    let last = performance.now();
    let triggeredThisLap = false;
    let rafId = 0;

    function frame(now: number) {
      const dt = now - last;
      last = now;
      const multiplier = hoveredRef.current !== null ? SLOW_MULTIPLIER : 1;
      progress += (dt / LAP_MS) * multiplier;
      if (progress >= 1) {
        progress -= 1;
        triggeredThisLap = false;
      }
      if (!triggeredThisLap && progress >= IMAGES_STAGE_PROGRESS) {
        triggeredThisLap = true;
        setBurstKey((k) => k + 1);
      }
      const track = trackRef.current;
      const box = boxRef.current;
      if (track && box) {
        const trackWidth = track.clientWidth - box.clientWidth;
        box.style.transform = `translate(${progress * trackWidth}px, -50%)`;
      }
      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [reducedMotion]);

  return (
    <div className="w-full max-w-none">
      <div
        ref={scrollRef}
        className="relative overflow-x-auto border border-line bg-panel px-4 py-8 [-webkit-overflow-scrolling:touch]"
      >
        <div
          ref={trackRef}
          className="relative flex min-w-[640px] items-start justify-between gap-2 sm:min-w-[720px] lg:min-w-0 lg:w-full"
        >
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-1 h-px -translate-y-1/2 bg-line"
          />
          {FACTORY_STAGES.map((stage, i) => (
            <div
              key={stage}
              onMouseEnter={() => setHoveredStage(i)}
              onMouseLeave={() =>
                setHoveredStage((s) => (s === i ? null : s))
              }
              data-cursor="interactive"
              className="relative z-10 flex min-w-0 flex-col items-center gap-2 bg-panel px-2 lg:min-w-0 lg:px-1"
            >
              <div className="h-2 w-2 shrink-0 rounded-full border border-line bg-void" />
              <span className="break-words text-center text-[10px] text-fg-muted">{stage}</span>
              {stage === "Изображения" && burstKey > 0 && (
                <div
                  key={burstKey}
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-10 left-1/2 flex -translate-x-1/2 gap-1"
                >
                  {Array.from({ length: THUMBS }).map((_, t) => (
                    <span
                      key={t}
                      className="h-2 w-2 bg-accent"
                      style={{
                        animation: "thumb-float 1.8s ease-out both",
                        animationDelay: `${t * 25}ms`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {!reducedMotion && (
            <div
              ref={boxRef}
              aria-hidden="true"
              className="absolute left-0 top-1 z-20 h-3 w-3 -translate-y-1/2 border border-accent bg-void"
            />
          )}
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-fg-muted">
        Пока ты листал, серия уже готова.
      </p>
      {canScroll && (
        <p className="mt-1 text-center text-[10px] text-fg-muted/60">
          ← смахните, чтобы увидеть весь конвейер →
        </p>
      )}
    </div>
  );
}
