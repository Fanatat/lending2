"use client";

import type { FridayGame } from "./data";
import CartridgeScreen from "./CartridgeScreen";

/**
 * One game of the Friday studio as a cartridge: a live miniature of the
 * game's mechanic on its "screen" (CartridgeScreen), the title plate below,
 * and a micro-fact that surfaces on hover.
 */
export default function Cartridge({
  game,
  staggerMs,
}: {
  game: FridayGame;
  staggerMs: number;
}) {
  return (
    <article className="group relative flex aspect-[4/3] flex-col overflow-hidden border border-line bg-panel transition-transform duration-300 [transform-style:preserve-3d] hover:-translate-y-2 lg:[transform:perspective(900px)_rotateY(-4deg)]">
      {/* The screen and the title plate are stacked, not overlaid: the
          miniature only ever draws inside the screen, so it can't slide
          under (or over) the title however small the card gets. */}
      <div className="relative min-h-0 flex-1">
        <CartridgeScreen slug={game.slug} offset={staggerMs} />

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
      </div>

      <div className="shrink-0 border-t border-line bg-void/80 px-3 py-2">
        <div className="flex items-baseline justify-between gap-2 whitespace-nowrap">
          <span className="truncate text-xs text-fg-primary sm:text-sm lg:text-xs xl:text-sm">{game.title}</span>
          {game.inDevelopment && (
            <span className="shrink-0 text-[9px] text-fg-muted xl:text-[10px]">в разработке</span>
          )}
        </div>
      </div>

      <span className="pointer-events-none absolute right-2 top-2 bg-void/80 px-1 text-[10px] text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        {game.microFact}
      </span>
    </article>
  );
}
