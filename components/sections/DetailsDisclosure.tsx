"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useReducedMotion } from "@/lib/motion";

interface DetailsDisclosureProps {
  text: ReactNode;
}

/**
 * "▸ Подробнее" disclosure with an animated height expand instead of the
 * native <details> element's instant snap-open. Uses the CSS grid
 * 0fr/1fr trick rather than measuring scrollHeight in JS — a JS-measured
 * max-height can go stale (e.g. before web fonts finish loading and nudge
 * line-height) and silently clip the last line; grid-template-rows always
 * tracks the content's real height.
 */
export default function DetailsDisclosure({ text }: DetailsDisclosureProps) {
  const [open, setOpen] = useState(false);
  const reducedMotion = useReducedMotion();

  return (
    <div className="mt-6 max-w-xl border-t border-line pt-4">
      <button
        type="button"
        data-cursor="interactive"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer text-sm text-accent"
      >
        {open ? "▾" : "▸"} Подробнее
      </button>
      <div
        style={{
          display: "grid",
          gridTemplateRows: reducedMotion ? undefined : open ? "1fr" : "0fr",
          transition: reducedMotion ? undefined : "grid-template-rows 300ms ease",
        }}
      >
        <div className="overflow-hidden" hidden={reducedMotion && !open}>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">{text}</p>
        </div>
      </div>
    </div>
  );
}
