"use client";

import ProjectCardLink from "@/components/transitions/ProjectCardLink";
import Cartridge from "./Cartridge";
import { FRIDAY_GAMES } from "./data";

export default function CartridgeGrid() {
  return (
    <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
      {FRIDAY_GAMES.map((game, i) => (
        <ProjectCardLink
          key={game.slug}
          href="/projects/friday-studio"
          ariaLabel={`Открыть проект: ${game.title}`}
        >
          <Cartridge game={game} staggerMs={i * 750} />
        </ProjectCardLink>
      ))}
    </div>
  );
}
