"use client";

import { useEffect, useRef, useState } from "react";
import ProjectCardLink from "@/components/transitions/ProjectCardLink";
import { AGENTS, HUB_ID } from "./agents";
import AgentAvatar from "./AgentAvatar";

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export default function StaffGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const avatarRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!hoveredId || !container) {
      setLines([]);
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const targetIds =
      hoveredId === HUB_ID
        ? AGENTS.filter((a) => a.id !== HUB_ID).map((a) => a.id)
        : [HUB_ID];
    const hoveredEl = avatarRefs.current[hoveredId];
    if (!hoveredEl) return;
    const hRect = hoveredEl.getBoundingClientRect();
    const from = {
      x: hRect.left + hRect.width / 2 - containerRect.left,
      y: hRect.top + hRect.height / 2 - containerRect.top,
    };
    const nextLines: Line[] = [];
    for (const id of targetIds) {
      const el = avatarRefs.current[id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      nextLines.push({
        x1: from.x,
        y1: from.y,
        x2: r.left + r.width / 2 - containerRect.left,
        y2: r.top + r.height / 2 - containerRect.top,
      });
    }
    setLines(nextLines);
  }, [hoveredId]);

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        {lines.map((l, i) => (
          <line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="var(--accent)"
            strokeWidth={1}
            opacity={0.5}
          />
        ))}
      </svg>

      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 sm:gap-6">
        {AGENTS.map((agent, i) => (
          <ProjectCardLink
            key={agent.id}
            href="/projects/staff"
            ariaLabel={`Открыть чат с агентом: ${agent.name}`}
          >
            <AgentAvatar
              ref={(el) => {
                avatarRefs.current[agent.id] = el;
              }}
              agent={agent}
              index={i}
              hovered={hoveredId === agent.id}
              onHoverStart={() => setHoveredId(agent.id)}
              onHoverEnd={() => setHoveredId((h) => (h === agent.id ? null : h))}
            />
          </ProjectCardLink>
        ))}
      </div>
    </div>
  );
}
