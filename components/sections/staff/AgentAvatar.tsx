"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { useHasFinePointer, useMousePosition, useReducedMotion } from "@/lib/motion";
import { useTypewriter } from "@/lib/useTypewriter";
import { useSystemStatusStore } from "@/lib/systemStatus";
import { CANNED_REPLIES, type Agent } from "./agents";

const MAX_OFFSET = 3;
const ONLINE_COLOR = "#3ddc6a";
const OFFLINE_COLOR = "#ff5d5d";

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
  const online = useSystemStatusStore((s) => s.status[agent.systemId].online);

  // Cycles through the agent's canned replies on each new hover instead of
  // always showing the first one, without reaching for Math.random() (see
  // ParticleDust's note on why that's the one place that's allowed to).
  const replies = CANNED_REPLIES[agent.id] ?? [];
  const hoverCountRef = useRef(0);
  const [replyIndex, setReplyIndex] = useState(0);
  const reply = replies.length > 0 ? replies[replyIndex % replies.length]! : "";
  const { output } = useTypewriter(reply, {
    start: hovered && replies.length > 0,
    speedMs: 26,
  });

  useEffect(() => {
    if (!hovered) return;
    setReplyIndex(hoverCountRef.current);
    hoverCountRef.current += 1;
  }, [hovered]);

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
      className="relative"
    >
      {hovered && replies.length > 0 && (
        <div
          role="status"
          className="pointer-events-none absolute -top-2 left-1/2 z-50 w-40 -translate-x-1/2 -translate-y-full break-words border border-accent bg-void px-2 py-1.5 text-center text-[9px] leading-snug text-accent"
        >
          {output}
          <span className="typing-cursor" aria-hidden="true">
            |
          </span>
        </div>
      )}
      <div
        ref={setInnerRef}
        className="decorative-loop flex flex-col gap-2 border border-line bg-panel p-3"
        style={{
          animation: `avatar-breathe ${3.2 + index * 0.3}s ease-in-out ${index * 0.15}s infinite`,
          outline: hovered ? "1px solid var(--accent)" : undefined,
          boxShadow: hovered ? "0 0 12px var(--accent)" : undefined,
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          transition: "transform 150ms ease-out, box-shadow 150ms ease-out",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex h-8 w-8 items-center justify-center border border-line text-[10px] text-fg-primary">
            {agent.initials}
          </div>
          <span
            aria-hidden="true"
            className={online ? "decorative-loop h-2 w-2 shrink-0 rounded-full" : "h-2 w-2 shrink-0 rounded-full"}
            style={{
              background: online ? ONLINE_COLOR : OFFLINE_COLOR,
              animation: online ? "status-blink 1.6s ease-in-out infinite" : undefined,
            }}
          />
        </div>
        <div>
          <div className="text-xs font-bold text-fg-primary">{agent.name}</div>
          <div className="text-[10px] text-fg-muted">{agent.status}</div>
        </div>
      </div>
    </div>
  );
});

export default AgentAvatar;
