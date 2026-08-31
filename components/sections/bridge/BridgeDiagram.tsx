"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useLabStore } from "@/lib/store";
import { useBridgeStore } from "@/lib/bridgeStore";
import { useReducedMotion } from "@/lib/motion";

const TOGGLE_WINDOW_MS = 5000;
const TOGGLES_FOR_UNICORN = 10;
const FALL_SPAWN_MS = 550;

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
  return (
    <div
      ref={pipeRef}
      className={`bridge-pipe flex-1 ${broken ? "bridge-pipe--broken" : ""}`}
      aria-hidden="true"
    >
      {!broken &&
        Array.from({ length: packetCount }).map((_, i) => (
          <span
            key={i}
            className="bridge-packet"
            style={{
              animationDelay: `${-(i * (2.4 / packetCount)).toFixed(2)}s`,
              animationDuration: unicorn ? "0.9s" : "2.4s",
              ...(unicorn
                ? { animationName: "packet-move, unicorn-hue" }
                : {}),
            }}
          />
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
  const spawnFalling = useBridgeStore((s) => s.spawnFalling);
  const toggleTimestamps = useRef<number[]>([]);
  const rightPipeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ipv6Broken || reducedMotion) return;
    const id = window.setInterval(() => {
      const el = rightPipeRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = r.left + Math.random() * r.width;
      spawnFalling(x, r.top, unicornMode);
    }, FALL_SPAWN_MS);
    return () => window.clearInterval(id);
  }, [ipv6Broken, unicornMode, reducedMotion, spawnFalling]);

  function handleToggle() {
    const next = !ipv6Broken;
    setIpv6Broken(next);

    const now = Date.now();
    const recent = [...toggleTimestamps.current, now].filter(
      (t) => now - t <= TOGGLE_WINDOW_MS
    );
    toggleTimestamps.current = recent;
    if (recent.length >= TOGGLES_FOR_UNICORN) {
      toggleTimestamps.current = [];
      const turnOn = !unicornMode;
      setUnicornMode(turnOn);
      if (turnOn) markFound("unicorn");
    }
  }

  return (
    <div className="w-full max-w-lg border border-line bg-panel p-6">
      <div className="flex items-center gap-3 text-center text-[10px] text-fg-muted">
        <div className="flex-1 border border-line px-2 py-3 text-fg-primary">
          Telegram
          <br />
          Desktop
        </div>
        <Pipe broken={false} unicorn={unicornMode} packetCount={unicornMode ? 6 : 2} />
        <div className="flex-1 border border-line px-2 py-3 text-fg-primary">
          Мост
        </div>
        <Pipe
          broken={ipv6Broken}
          unicorn={unicornMode}
          packetCount={unicornMode ? 6 : 2}
          pipeRef={rightPipeRef}
        />
        <div className="flex-1 border border-line px-2 py-3 text-fg-primary">
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
