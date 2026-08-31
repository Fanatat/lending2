"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/motion";
import type { FridayGame } from "./data";

const FRAME_COUNT = 4;
const FRAME_MS = 3000;

/**
 * Placeholder in-cartridge slideshow — cycles through numbered frame tiles.
 * TODO(автор): заменить на реальные кадры геймплея каждой игры.
 */
export default function Cartridge({
  game,
  staggerMs,
}: {
  game: FridayGame;
  staggerMs: number;
}) {
  const reducedMotion = useReducedMotion();
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    let interval: number | undefined;
    const initial = window.setTimeout(() => {
      setFrame((f) => (f + 1) % FRAME_COUNT);
      interval = window.setInterval(() => {
        setFrame((f) => (f + 1) % FRAME_COUNT);
      }, FRAME_MS);
    }, staggerMs);
    return () => {
      window.clearTimeout(initial);
      if (interval) window.clearInterval(interval);
    };
  }, [reducedMotion, staggerMs]);

  return (
    <article className="group relative aspect-[4/3] overflow-hidden border border-line bg-panel transition-transform duration-300 [transform-style:preserve-3d] hover:-translate-y-2 lg:[transform:perspective(900px)_rotateY(-4deg)]">
      <div className="absolute inset-0" aria-hidden="true">
        {Array.from({ length: FRAME_COUNT }).map((_, i) => (
          <div
            key={i}
            className="absolute inset-0 flex items-center justify-center text-4xl text-fg-muted/30 transition-opacity duration-700"
            style={{ opacity: frame === i ? 1 : 0 }}
          >
            {game.title.slice(0, 1)}
            <span className="ml-1 text-xs align-super">{i + 1}</span>
          </div>
        ))}
      </div>

      {/* projection grid, appears on hover */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          backgroundImage:
            "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />

      <div className="absolute bottom-0 left-0 right-0 border-t border-line bg-void/80 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-fg-primary">{game.title}</span>
          {game.inDevelopment && (
            <span className="text-[10px] text-fg-muted">в разработке</span>
          )}
        </div>
      </div>

      <span className="pointer-events-none absolute right-2 top-2 text-[10px] text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        {game.microFact}
      </span>
    </article>
  );
}
