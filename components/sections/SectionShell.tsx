"use client";

import type { ReactNode } from "react";
import RevealOnScroll from "@/components/effects/RevealOnScroll";

interface SectionShellProps {
  id: string;
  number: string;
  title: string;
  line: string;
  details?: string;
  /** Small mysterious footnote under the details (e.g. Ол Ин's "(но что?)"). */
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
      className="border-t border-line px-6 py-20 sm:px-10 md:px-16"
    >
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
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
          <RevealOnScroll index={2}>
            <p className="mt-4 max-w-xl text-sm text-fg-primary/90 sm:text-base">
              {line}
            </p>
          </RevealOnScroll>
          {details && (
            <RevealOnScroll index={3}>
              <details className="mt-6 max-w-xl border-t border-line pt-4">
                <summary
                  data-cursor="interactive"
                  className="cursor-pointer text-sm text-accent"
                >
                  ▸ Подробнее
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                  {details}
                </p>
              </details>
            </RevealOnScroll>
          )}
          {footnote && (
            <RevealOnScroll index={4}>
              <p className="mt-3 text-[10px] text-fg-muted/60">{footnote}</p>
            </RevealOnScroll>
          )}
        </div>
        <RevealOnScroll index={2} className="flex items-center justify-center">
          {children}
        </RevealOnScroll>
      </div>
    </section>
  );
}
