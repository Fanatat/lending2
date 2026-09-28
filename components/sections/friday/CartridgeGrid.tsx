"use client";

import ProjectCardLink from "@/components/transitions/ProjectCardLink";
import Cartridge from "./Cartridge";
import { FRIDAY_GAMES } from "./data";

const gameLink =
  "text-[11px] text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent";

/** Each cartridge leads to the studio page; the links under it lead to the game itself and its code. */
export default function CartridgeGrid() {
  return (
    <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
      {FRIDAY_GAMES.map((game, i) => (
        <div key={game.slug} className="min-w-0">
          <ProjectCardLink
            href="/projects/friday-studio"
            ariaLabel={`Открыть проект: ${game.title}`}
          >
            <Cartridge game={game} staggerMs={i * 750} />
          </ProjectCardLink>
          <div className="mt-2 flex gap-4">
            <a
              href={game.playUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="interactive"
              aria-label={`Играть: ${game.title}`}
              className={gameLink}
            >
              Играть ↗
            </a>
            <a
              href={game.codeUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="interactive"
              aria-label={`Код игры ${game.title} на GitHub`}
              className={gameLink}
            >
              Код ↗
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
