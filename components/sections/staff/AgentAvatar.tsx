"use client";

import { forwardRef, useEffect, useState } from "react";
import { useHasFinePointer, useMousePosition, useReducedMotion } from "@/lib/motion";
import type { Agent } from "./agents";

const MAX_OFFSET = 4;

const AgentAvatar = forwardRef<
  HTMLDivElement,
  {
    agent: Agent;
    index: number;
    hovered: boolean;
    onHoverStart: () => void;
    onHoverEnd: () => void;
  }
>(function AgentAvatar({ agent, index, hovered, onHoverStart, onHoverEnd }, ref) {
  const hasFinePointer = useHasFinePointer();
  const reducedMotion = useReducedMotion();
  const pointer = useMousePosition();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [innerRef, setInnerRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasFinePointer || reducedMotion || !innerRef) return;
    const rect = innerRef.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = pointer.x - cx;
    const dy = pointer.y - cy;
    const dist = Math.hypot(dx, dy) || 1;
    const r = Math.min(MAX_OFFSET, dist / 20);
    setOffset({ x: (dx / dist) * r, y: (dy / dist) * r });
  }, [pointer, hasFinePointer, reducedMotion, innerRef]);

  return (
    <div
      ref={ref}
      data-cursor="interactive"
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      className="flex flex-col items-center gap-2"
    >
      <div
        ref={setInnerRef}
        className="decorative-loop relative flex h-14 w-14 items-center justify-center rounded-full border border-line text-xs text-fg-primary"
        style={{
          animation: `avatar-breathe ${3.2 + index * 0.3}s ease-in-out ${index * 0.15}s infinite`,
          outline: hovered ? "1px solid var(--accent)" : undefined,
        }}
      >
        {agent.initials}
        <span
          aria-hidden="true"
          className="absolute text-accent"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px)`,
            transition: "transform 150ms ease-out",
          }}
        >
          <span className="typing-cursor">_</span>
        </span>
      </div>
      <div className="text-center text-[10px] text-fg-muted">
        {agent.name}
        <br />
        {agent.status}
      </div>
    </div>
  );
});

export default AgentAvatar;
