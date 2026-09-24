"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/motion";
import { useLabStore } from "@/lib/store";
import { playSfx } from "@/lib/sfx";
import ProjectCardLink from "@/components/transitions/ProjectCardLink";
import { NODES, EDGES, COMPROMISED_EDGES, type NetNode } from "./nodes";

const DWELL_MS = 7000;
const TOAST_MS = 3200;
const RETRY_MS = 6000;
/** The intruder's path: outside → router (lingers) → server. */
const LEG_A_MS = 2600;
const PAUSE_MS = 1300;
const LEG_B_MS = 2400;

function isCompromised(a: string, b: string) {
  return COMPROMISED_EDGES.some(
    ([ca, cb]) => (a === ca && b === cb) || (a === cb && b === ca)
  );
}

function nodeById(id: string) {
  return NODES.find((n) => n.id === id)!;
}

/** Intruder position (in % of the map) `ms` after it set off. */
function intruderAt(ms: number): { x: number; y: number; done: boolean } {
  const a = nodeById("perimeter");
  const b = nodeById("router");
  const c = nodeById("server");
  const lerp = (p: NetNode, q: NetNode, k: number) => ({
    x: p.x + (q.x - p.x) * k,
    y: p.y + (q.y - p.y) * k,
    done: false,
  });
  if (ms < LEG_A_MS) return lerp(a, b, ms / LEG_A_MS);
  ms -= LEG_A_MS;
  if (ms < PAUSE_MS) return { x: b.x, y: b.y, done: false };
  ms -= PAUSE_MS;
  if (ms < LEG_B_MS) return lerp(b, c, ms / LEG_B_MS);
  return { x: c.x, y: c.y, done: true };
}

type IntruderState = "hidden" | "moving" | "caught" | "breached";

/**
 * Home network map. Easter egg: after the map has been in view for a while,
 * an intruder "?" sets off from the external perimeter along the attack
 * path toward the server. Click it before it gets there to close the
 * perimeter; miss, and it breaches the server and comes back for another try.
 */
export default function PerimeterMap() {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const intruderRef = useRef<HTMLButtonElement>(null);
  const [intruder, setIntruder] = useState<IntruderState>("hidden");
  const [resolved, setResolved] = useState(false);
  const [shake, setShake] = useState(false);
  const [toast, setToast] = useState<null | "caught" | "breached">(null);
  const markFound = useLabStore((s) => s.markFound);
  const stateRef = useRef<IntruderState>("hidden");
  stateRef.current = intruder;

  useEffect(() => {
    if (reducedMotion || resolved || intruder !== "hidden") return;
    const el = containerRef.current;
    if (!el) return;
    let timer: number | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          timer = window.setTimeout(() => setIntruder("moving"), DWELL_MS);
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
  }, [reducedMotion, resolved, intruder]);

  useEffect(() => {
    if (intruder !== "moving") return;
    const t0 = performance.now();
    let raf = 0;
    function frame(now: number) {
      const p = intruderAt(now - t0);
      const el = intruderRef.current;
      if (el) {
        el.style.left = `${p.x}%`;
        el.style.top = `${p.y}%`;
      }
      if (p.done) {
        setIntruder("breached");
        return;
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [intruder]);

  useEffect(() => {
    if (intruder !== "breached") return;
    playSfx("alarm", { volume: 0.5 });
    setShake(true);
    setToast("breached");
    const timers = [
      window.setTimeout(() => setShake(false), 400),
      window.setTimeout(() => setToast(null), TOAST_MS),
      window.setTimeout(() => setIntruder("hidden"), RETRY_MS),
    ];
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [intruder]);

  function neutralizeThreat() {
    if (stateRef.current !== "moving") return;
    playSfx("zap");
    setIntruder("caught");
    setShake(true);
    setResolved(true);
    markFound("hacker");
    window.setTimeout(() => setShake(false), 300);
    window.setTimeout(() => setIntruder("hidden"), 700);
    setToast("caught");
    window.setTimeout(() => setToast(null), TOAST_MS);
  }

  const start = nodeById("perimeter");

  return (
    <div className="relative w-full max-w-sm">
      <div
        ref={containerRef}
        className="relative aspect-square w-full border border-line bg-panel transition-shadow"
        style={{
          transform: shake ? "translateX(2px)" : undefined,
          boxShadow: intruder === "breached" ? "inset 0 0 40px rgba(255,93,93,0.35)" : undefined,
        }}
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

        {(intruder === "moving" || intruder === "caught") && (
          <button
            ref={intruderRef}
            type="button"
            data-cursor="interactive"
            onClick={neutralizeThreat}
            aria-label="Нарушитель в сети — нейтрализовать"
            className={`perimeter-intruder ${intruder === "caught" ? "perimeter-intruder--caught" : ""}`}
            style={{ left: `${start.x}%`, top: `${start.y}%` }}
          >
            {intruder === "caught" ? "×" : "?"}
          </button>
        )}
      </div>

      {toast && (
        <div
          role="status"
          className={`absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap border bg-void px-3 py-1 text-[10px] ${
            toast === "caught" ? "border-accent text-accent" : "border-[#ff5d5d] text-[#ff5d5d]"
          }`}
        >
          {toast === "caught"
            ? "THREAT NEUTRALIZED. Периметр закрыт."
            : "СЕРВЕР ДОСТИГНУТ. Нарушитель ушёл, но вернётся."}
        </div>
      )}
    </div>
  );
}
