"use client";

import type { ReactNode } from "react";
import RevealOnScroll from "@/components/effects/RevealOnScroll";
import DetailsDisclosure from "./DetailsDisclosure";

interface SectionShellProps {
  id: string;
  number: string;
  title: string;
  line: ReactNode;
  details?: ReactNode;
  /** Small mysterious aside right under the title (e.g. Ол Ин's "что?"). */
  footnote?: string;
  children?: ReactNode;
}

/**
 * Shared chrome for the 9 dashboard blocks: eyebrow number, title, body
 * line, an optional "▸ Подробнее" disclosure, and a slot for the block's
 * own visual widget. Text column left, widget column right on desktop.
 */
export default function SectionShell({
  id,
  number,
  title,
  line,
  details,
  footnote,
  children,
}: SectionShellProps) {
  return (
    <section
      id={id}
      className="border-t border-line px-4 py-14 sm:px-6 sm:py-20 md:px-10 lg:px-16"
    >
      <div className="grid min-w-0 items-start gap-8 lg:grid-cols-2 lg:gap-16">
        <div className="min-w-0">
          <RevealOnScroll index={0}>
            <div className="text-xs tracking-widest text-fg-muted">
              {number}
            </div>
          </RevealOnScroll>
          <RevealOnScroll index={1}>
            <h2 className="mt-2 max-w-xl text-2xl text-fg-primary sm:text-3xl">
              {title}
            </h2>
          </RevealOnScroll>
          {footnote && (
            <RevealOnScroll index={1}>
              <p className="mt-1 text-[9px] text-fg-muted/60">{footnote}</p>
            </RevealOnScroll>
          )}
          <RevealOnScroll index={2}>
            <p className="mt-4 max-w-xl text-sm text-fg-primary/90 sm:text-base">
              {line}
            </p>
          </RevealOnScroll>
          {details && (
            <RevealOnScroll index={3}>
              <DetailsDisclosure text={details} />
            </RevealOnScroll>
          )}
        </div>
        <RevealOnScroll
          index={2}
          className="flex min-w-0 items-center justify-center"
        >
          {children}
        </RevealOnScroll>
      </div>
    </section>
  );
}
