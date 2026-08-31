"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/motion";

interface DetailsDisclosureProps {
  text: string;
}

/**
 * "▸ Подробнее" disclosure with an animated height expand instead of the
 * native <details> element's instant snap-open (which also made the block
 * below/right of it jump).
 */
export default function DetailsDisclosure({ text }: DetailsDisclosureProps) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    function measure() {
      if (open && el) setMaxHeight(el.scrollHeight);
    }

    measure();
    if (!open) {
      setMaxHeight(0);
      return;
    }
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open]);

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
          maxHeight: reducedMotion ? undefined : `${maxHeight}px`,
          overflow: "hidden",
          transition: reducedMotion ? undefined : "max-height 300ms ease",
        }}
      >
        <div ref={contentRef} hidden={reducedMotion && !open}>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">{text}</p>
        </div>
      </div>
    </div>
  );
}
