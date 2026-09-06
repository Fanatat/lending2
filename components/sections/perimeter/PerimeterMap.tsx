"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/motion";
import ProjectCardLink from "@/components/transitions/ProjectCardLink";
import { NODES, EDGES, COMPROMISED_EDGES } from "./nodes";

const DWELL_MS = 15000;
const TOAST_MS = 3000;

function isCompromised(a: string, b: string) {
  return COMPROMISED_EDGES.some(
    ([ca, cb]) => (a === ca && b === cb) || (a === cb && b === ca)
  );
}

function nodeById(id: string) {
  return NODES.find((n) => n.id === id)!;
}

export default function PerimeterMap() {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hackerVisible, setHackerVisible] = useState(false);
  const [neutralized, setNeutralized] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [shake, setShake] = useState(false);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    const el = containerRef.current;
    if (!el) return;
    let timer: number | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          timer = window.setTimeout(() => setHackerVisible(true), DWELL_MS);
        } else if (timer) {
          window.clearTimeout(timer);
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timer) window.clearTimeout(timer);
    };
  }, [reducedMotion]);

  function neutralizeThreat() {
    setShake(true);
    setNeutralized(true);
    setResolved(true);
    window.setTimeout(() => setShake(false), 300);
    window.setTimeout(() => {
      setHackerVisible(false);
      setNeutralized(false);
    }, 700);
    setToast(true);
    window.setTimeout(() => setToast(false), TOAST_MS);
  }

  return (
    <div className="relative w-full max-w-sm">
      <div
        ref={containerRef}
        className="relative aspect-square w-full border border-line bg-panel"
        style={{ transform: shake ? "translateX(2px)" : undefined }}
      >
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          {EDGES.map(([a, b]) => {
            const na = nodeById(a);
            const nb = nodeById(b);
            const compromised = !resolved && isCompromised(a, b);
            const pathId = `edge-${a}-${b}`;
            return (
              <g key={pathId}>
                <path
                  id={pathId}
                  d={`M ${na.x} ${na.y} L ${nb.x} ${nb.y}`}
                  fill="none"
                  stroke={compromised ? "#ff5d5d" : "var(--line)"}
                  strokeWidth={compromised ? 0.8 : 0.5}
                  className={compromised ? "decorative-loop" : undefined}
                  style={
                    compromised
                      ? { animation: "edge-vibrate 0.4s linear infinite" }
                      : undefined
                  }
                />
                {!reducedMotion && (
                  <circle r={1.1} fill={compromised ? "#ff5d5d" : "var(--accent)"}>
                    <animateMotion
                      dur={compromised ? "1.1s" : "2.4s"}
                      repeatCount="indefinite"
                    >
                      <mpath href={`#${pathId}`} />
                    </animateMotion>
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {NODES.map((n) => {
          const sideLabel = n.labelSide === "right";
          return (
            <div
              key={n.id}
              className="absolute"
              style={{
                left: `${n.x}%`,
                top: `${n.y}%`,
                // Center the dot itself (h-2.5 = 10px, so half is 5px) on
                // (x%, y%) — matches the SVG edges' coordinates. For a
                // bottom label that's -50%/-5px (dot centered horizontally,
                // nudged up); for a side label the row starts at the dot
                // instead of being centered on it, so only the dot's own
                // half-width/half-height needs subtracting.
                transform: sideLabel
                  ? "translate(-5px, -5px)"
                  : "translate(-50%, -5px)",
              }}
            >
              <ProjectCardLink
                href="/projects/perimeter"
                ariaLabel={`Открыть отчёт по узлу: ${n.label}`}
                className={
                  sideLabel
                    ? "flex flex-row items-center gap-2"
                    : "flex flex-col items-center gap-1"
                }
              >
                <div className="relative h-2.5 w-2.5 shrink-0 rounded-full border border-line bg-void">
                  {n.vulnerable && !resolved && (
                    <span
                      className="decorative-loop absolute -inset-1 rounded-full bg-[#ff5d5d]"
                      style={{ animation: "status-blink 0.8s steps(1) infinite" }}
                      aria-hidden="true"
                    />
                  )}
                </div>
                <span
                  className="whitespace-nowrap text-[9px] text-fg-muted"
                  style={sideLabel ? undefined : { marginTop: "8px" }}
                >
                  {n.label}
                </span>
              </ProjectCardLink>
            </div>
          );
        })}

        {hackerVisible && (
          <button
            type="button"
            data-cursor="interactive"
            onClick={neutralizeThreat}
            aria-label="Нейтрализовать угрозу"
            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center border border-[#ff5d5d] bg-void text-[10px] text-[#ff5d5d]"
          >
            {neutralized ? "×" : "?"}
          </button>
        )}
      </div>

      {toast && (
        <div
          role="status"
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap border border-accent bg-void px-3 py-1 text-[10px] text-accent"
        >
          THREAT NEUTRALIZED. Периметр закрыт.
        </div>
      )}
    </div>
  );
}
