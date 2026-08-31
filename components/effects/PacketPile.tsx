"use client";

import { useEffect, useRef } from "react";
import { useBridgeStore } from "@/lib/bridgeStore";

function FallingPacket({
  id,
  x,
  y,
  unicorn,
}: {
  id: number;
  x: number;
  y: number;
  unicorn: boolean;
}) {
  const land = useBridgeStore((s) => s.land);
  const elRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const dropDistance = window.innerHeight - y;
    const raf = requestAnimationFrame(() => {
      el.style.transform = `translateY(${dropDistance}px)`;
      el.style.opacity = "0.15";
    });
    return () => cancelAnimationFrame(raf);
    // mount-only: starts the fall once, independent of later re-renders
    // triggered by sibling packets spawning/landing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span
      ref={elRef}
      onTransitionEnd={() => land(id)}
      className={unicorn ? "h-2 w-2" : "h-2 w-2 bg-accent"}
      style={{
        position: "fixed",
        left: x,
        top: y,
        transform: "translateY(0)",
        transition: "transform 700ms cubic-bezier(.4,0,1,1), opacity 700ms ease-in",
        animation: unicorn ? "unicorn-hue 0.6s linear infinite" : undefined,
      }}
    />
  );
}

/**
 * Falling packets (spawned when "Мост" breaks) plus the pile they leave at
 * the bottom of the viewport — the self-ironic visualization of the IPv6
 * misconfiguration state (see ТЗ, блок 4). Global so both survive scrolling
 * away from the section that spawned them.
 */
export default function PacketPile() {
  const fallenCount = useBridgeStore((s) => s.fallenCount);
  const falling = useBridgeStore((s) => s.falling);

  return (
    <>
      {falling.map((p) => (
        <FallingPacket key={p.id} {...p} />
      ))}

      {fallenCount > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed bottom-0 left-0 right-0 z-30 flex flex-wrap items-end gap-[2px] px-2 pb-1"
        >
          {Array.from({ length: fallenCount }).map((_, i) => (
            <span
              key={i}
              className="h-2 w-2 shrink-0 bg-accent/70"
              style={{ opacity: 0.5 + (i % 5) * 0.1 }}
            />
          ))}
        </div>
      )}
    </>
  );
}
