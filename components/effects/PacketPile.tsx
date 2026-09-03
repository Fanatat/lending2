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

  // Packets trip at the pipe's midpoint and drop right there — a short
  // stumble-and-vanish, not a trip down the whole viewport. The persistent
  // pile at the bottom is a separate, deliberately global tally (see below).
  const DROP_DISTANCE = 22;

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.style.transform = `translateY(${DROP_DISTANCE}px)`;
      el.style.opacity = "0";
    });
    return () => cancelAnimationFrame(raf);
    // mount-only: starts the fall once, independent of later re-renders
    // triggered by sibling packets spawning/landing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span
      ref={elRef}
      onTransitionEnd={() => land(id, unicorn)}
      className={unicorn ? "h-2 w-2" : "h-2 w-2 bg-accent"}
      style={{
        position: "fixed",
        left: x,
        top: y,
        transform: "translateY(0)",
        transition: "transform 400ms cubic-bezier(.4,0,1,1), opacity 400ms ease-in",
        animation: unicorn ? "unicorn-hue 0.6s linear infinite" : undefined,
      }}
    />
  );
}

function PiledDot({
  id,
  unicorn,
  evicting,
}: {
  id: number;
  unicorn: boolean;
  evicting: boolean;
}) {
  const evict = useBridgeStore((s) => s.evict);

  return (
    <span
      onTransitionEnd={() => {
        if (evicting) evict(id);
      }}
      className={unicorn ? "h-3 w-3 shrink-0" : "h-3 w-3 shrink-0 bg-accent"}
      style={{
        opacity: evicting ? 0 : 0.7 + (id % 5) * 0.06,
        transform: evicting ? "translateY(3px) scale(0.5)" : "translateY(0) scale(1)",
        transition: "opacity 350ms ease, transform 350ms ease",
        animation: unicorn ? "unicorn-hue 0.6s linear infinite" : undefined,
      }}
    />
  );
}

/**
 * Falling packets (spawned when "Мост" breaks) plus the pile they leave at
 * the bottom of the viewport — the self-ironic visualization of the IPv6
 * misconfiguration state (see ТЗ, блок 4). Global so both survive scrolling
 * away from the section that spawned them. The pile is a rolling window
 * (see lib/bridgeStore's PILE_LIMIT): past the cap the oldest dot fades out
 * here instead of the row silently snapping shorter.
 */
export default function PacketPile() {
  const piled = useBridgeStore((s) => s.piled);
  const falling = useBridgeStore((s) => s.falling);

  return (
    <>
      {falling.map((p) => (
        <FallingPacket key={p.id} {...p} />
      ))}

      {piled.length > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed bottom-0 left-0 right-0 z-30 flex flex-wrap items-end gap-[3px] border-t-2 border-accent/70 bg-void/80 px-2 pb-1.5 pt-1.5"
        >
          {piled.map((p) => (
            <PiledDot key={p.id} {...p} />
          ))}
        </div>
      )}
    </>
  );
}
