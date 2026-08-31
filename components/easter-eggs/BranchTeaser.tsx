"use client";

import { useRef, useState } from "react";
import { useBranchStore } from "@/lib/branchStore";

const HOLD_MS = 3000;

/** The barely-visible dot at the very bottom of the page — entry point to the flashlight easter egg. */
export default function BranchTeaser() {
  const setOpen = useBranchStore((s) => s.setOpen);
  const [hovered, setHovered] = useState(false);
  const [held, setHeld] = useState(false);
  const holdTimer = useRef<number | undefined>(undefined);

  function startHold() {
    holdTimer.current = window.setTimeout(() => setHeld(true), HOLD_MS);
  }

  function cancelHold() {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    setHeld(false);
  }

  return (
    <div className="flex justify-center py-16">
      <button
        type="button"
        data-cursor="interactive"
        aria-label="???"
        onMouseEnter={() => {
          setHovered(true);
          startHold();
        }}
        onMouseLeave={() => {
          setHovered(false);
          cancelHold();
        }}
        onTouchStart={() => {
          setHovered(true);
          startHold();
        }}
        onTouchEnd={cancelHold}
        onClick={() => setOpen(true)}
        className="flex items-center gap-2"
      >
        <span
          className="h-[3px] w-[3px] rounded-full transition-colors duration-300"
          style={{ background: hovered ? "var(--accent)" : "#333" }}
        />
        <span
          className="overflow-hidden whitespace-nowrap text-[10px] text-fg-muted transition-all duration-300"
          style={{
            maxWidth: hovered ? "200px" : "0px",
            opacity: hovered ? 1 : 0,
          }}
        >
          Coming soon{held ? " (+5 projects)" : ""}
        </span>
      </button>
    </div>
  );
}
