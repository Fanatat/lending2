"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useLabStore } from "@/lib/store";
import { requestFall } from "@/lib/bridgeStore";
import { playSfx } from "@/lib/sfx";
import { useReducedMotion } from "@/lib/motion";

const TOGGLE_WINDOW_MS = 5000;
const TOGGLES_FOR_UNICORN = 10;

// Runners cross the full pipe in 2.4s (0.9s in unicorn mode). When the pipe
// is broken they only make it to the gap in the middle before dropping
// through it (and down the whole page — see CrowdFall), so that leg takes
// half as long.
const TRAVEL_MS = 2.4;
const TRAVEL_MS_UNICORN = 0.9;

/** A tiny pixel runner — legs and arms swing via CSS (see .runner-* in globals.css). */
function Runner({ phase }: { phase: number }) {
  return (
    <svg viewBox="0 0 10 14" className="bridge-runner" style={{ animationDelay: `${-phase * 0.13}s` }}>
      <circle cx="5.4" cy="2" r="1.7" fill="currentColor" />
      <path d="M5.2 4 L4.6 8.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <g className="runner-limb runner-arm-a">
        <path d="M5.1 4.9 L6.9 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      </g>
      <g className="runner-limb runner-arm-b">
        <path d="M5.1 4.9 L3.2 6.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      </g>
      <g className="runner-limb runner-leg-a">
        <path d="M4.6 8.4 L6.4 10.8 L6 13.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
      <g className="runner-limb runner-leg-b">
        <path d="M4.6 8.4 L3.4 11 L2.2 12.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    </svg>
  );
}

function Pipe({
  broken,
  unicorn,
  packetCount,
  pipeRef,
}: {
  broken: boolean;
  unicorn: boolean;
  packetCount: number;
  pipeRef?: RefObject<HTMLDivElement>;
}) {
  const fullDuration = unicorn ? TRAVEL_MS_UNICORN : TRAVEL_MS;
  const duration = broken ? fullDuration / 2 : fullDuration;

  return (
    <div
      ref={pipeRef}
      className={`bridge-pipe flex-1 lg:flex-[4.5] ${broken ? "bridge-pipe--broken" : ""}`}
      aria-hidden="true"
    >
      {Array.from({ length: packetCount }).map((_, i) => (
        <span
          key={i}
          className={`bridge-packet ${broken ? "bridge-packet--broken" : ""}`}
          style={{
            animationDelay: `${-(i * (duration / packetCount)).toFixed(2)}s`,
            animationDuration: `${duration}s`,
            ...(unicorn
              ? {
                  animationName: broken
                    ? "packet-approach-gap, unicorn-hue"
                    : "packet-move, unicorn-hue",
                }
              : {}),
          }}
        >
          <Runner phase={i} />
        </span>
      ))}
    </div>
  );
}

export default function BridgeDiagram() {
  const reducedMotion = useReducedMotion();
  const [ipv6Broken, setIpv6Broken] = useState(false);
  const unicornMode = useLabStore((s) => s.unicornMode);
  const setUnicornMode = useLabStore((s) => s.setUnicornMode);
  const markFound = useLabStore((s) => s.markFound);
  const toggleTimestamps = useRef<number[]>([]);
  const rightPipeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ipv6Broken || reducedMotion) return;
    const packetCount = unicornMode ? 7 : 3;
    const fullDuration = unicornMode ? TRAVEL_MS_UNICORN : TRAVEL_MS;
    const brokenDuration = (fullDuration / 2) * 1000;
    const spawnEveryMs = brokenDuration / packetCount;
    const id = window.setInterval(() => {
      const el = rightPipeRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // Packets trip exactly at the midpoint of the pipe — see
      // packet-approach-gap in globals.css, which vanishes them there too.
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      requestFall({ x, y, unicorn: unicornMode });
    }, spawnEveryMs);
    return () => window.clearInterval(id);
  }, [ipv6Broken, unicornMode, reducedMotion]);

  function handleToggle() {
    const next = !ipv6Broken;
    setIpv6Broken(next);
    playSfx("ui_click");

    const now = Date.now();
    const recent = [...toggleTimestamps.current, now].filter(
      (t) => now - t <= TOGGLE_WINDOW_MS
    );
    toggleTimestamps.current = recent;
    if (recent.length >= TOGGLES_FOR_UNICORN) {
      toggleTimestamps.current = [];
      const turnOn = !unicornMode;
      setUnicornMode(turnOn);
      if (turnOn) {
        markFound("unicorn");
        playSfx("unicorn");
      }
    }
  }

  return (
    <div className="w-full max-w-lg border border-line bg-panel p-4 sm:p-6 lg:max-w-2xl">
      <div className="flex items-center gap-1.5 text-center text-[9px] text-fg-muted sm:gap-3 sm:text-[10px]">
        <div className="flex-1 border border-line px-1 py-3 text-fg-primary sm:px-2">
          <span className="text-fg-muted/50 line-through">Telegram</span>
          <br />
          Desktop
        </div>
        <Pipe broken={false} unicorn={unicornMode} packetCount={unicornMode ? 7 : 3} />
        <div className="flex-1 border border-line px-1 py-3 text-fg-primary sm:px-2">
          Мост
        </div>
        <Pipe
          broken={ipv6Broken}
          unicorn={unicornMode}
          packetCount={unicornMode ? 7 : 3}
          pipeRef={rightPipeRef}
        />
        <div className="flex-1 border border-line px-1 py-3 text-fg-primary sm:px-2">
          HTTP
          <br />
          прокси
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
        <span className="text-xs text-fg-muted">
          IPv6 {ipv6Broken ? "(конфликт)" : "(корректно)"}
        </span>
        <button
          type="button"
          data-cursor="interactive"
          role="switch"
          aria-checked={ipv6Broken}
          onClick={handleToggle}
          className={`relative h-5 w-9 border border-line transition-colors ${ipv6Broken ? "bg-[#ff5d5d]/30" : "bg-void"}`}
        >
          <span
            className="absolute top-0.5 h-3.5 w-3.5 bg-fg-primary transition-transform"
            style={{ transform: ipv6Broken ? "translateX(18px)" : "translateX(2px)" }}
          />
        </button>
      </div>
    </div>
  );
}
