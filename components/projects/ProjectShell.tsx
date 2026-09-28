"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import SystemStatusLine from "@/components/sections/SystemStatusLine";
import type { ProjectMeta } from "@/lib/projects";
import { MAX_URL, TELEGRAM_URL } from "@/lib/site";

interface ProjectShellProps {
  meta: ProjectMeta;
  number: string;
  /** The system's headline from the dashboard, shown as the lead. */
  lead: string;
  details: ReactNode;
  prev: ProjectMeta;
  next: ProjectMeta;
  widget: ReactNode;
  flow: ReactNode;
}

const contactButton =
  "inline-block border border-accent px-5 py-3 text-sm text-accent transition-[filter] duration-200 hover:[filter:drop-shadow(0_0_6px_var(--accent))]";

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-5 text-[10px] uppercase tracking-widest text-fg-muted">
      {children}
    </h2>
  );
}

/**
 * Shared chrome for /projects/[slug]: back to the system's block on the
 * dashboard, the system's headline and full copy, its live widget, the
 * "Как устроено" pipeline, a way to get in touch right where the visitor
 * finished reading, and prev/next navigation between systems.
 */
export default function ProjectShell({
  meta,
  number,
  lead,
  details,
  prev,
  next,
  widget,
  flow,
}: ProjectShellProps) {
  return (
    <main className="min-h-[100svh] px-4 pb-28 pt-16 sm:px-6 md:px-10 lg:px-16">
      <Link
        href={`/#${meta.anchor}`}
        data-cursor="interactive"
        className="text-xs text-fg-muted transition-colors hover:text-accent"
      >
        ← на дашборд
      </Link>

      <header className="mt-8 max-w-3xl">
        <div className="text-xs tracking-widest text-fg-muted">{number}</div>
        <h1 className="mt-2 text-3xl text-fg-primary sm:text-4xl">{meta.title}</h1>
        {lead !== meta.title && (
          <p className="mt-3 text-base text-fg-primary/80 sm:text-lg">{lead}</p>
        )}
        <SystemStatusLine systemId={meta.system} className="mt-4" />
      </header>

      <div className="mt-10 grid min-w-0 items-start gap-10 lg:grid-cols-2 lg:gap-16">
        <section className="min-w-0">
          <SectionLabel>Что это</SectionLabel>
          <p className="max-w-xl text-sm leading-relaxed text-fg-primary/90">{details}</p>
        </section>
        <section className="min-w-0">
          <SectionLabel>Вживую</SectionLabel>
          <div className="flex min-w-0 justify-center lg:justify-start">{widget}</div>
        </section>
      </div>

      <section className="mt-16 max-w-4xl border-t border-line pt-10">
        <SectionLabel>Как устроено</SectionLabel>
        {flow}
      </section>

      <section className="mt-16 max-w-4xl border-t border-line pt-10">
        <SectionLabel>Похожая задача?</SectionLabel>
        <p className="max-w-xl text-sm leading-relaxed text-fg-primary/90">
          Напишите, что нужно сделать, — отвечу и расскажу, как бы я это решал.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="interactive"
            className={contactButton}
          >
            Написать в Telegram
          </a>
          <a
            href={MAX_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="interactive"
            className={contactButton}
          >
            Написать в MAX
          </a>
        </div>
      </section>

      <nav
        aria-label="Другие системы"
        className="mt-16 grid max-w-4xl grid-cols-2 gap-4 border-t border-line pt-8"
      >
        <Link
          href={`/projects/${prev.slug}`}
          data-cursor="interactive"
          className="group text-left"
        >
          <div className="text-[10px] text-fg-muted">← предыдущая</div>
          <div className="mt-1 text-sm text-fg-primary transition-colors group-hover:text-accent">
            {prev.title}
          </div>
        </Link>
        <Link
          href={`/projects/${next.slug}`}
          data-cursor="interactive"
          className="group text-right"
        >
          <div className="text-[10px] text-fg-muted">следующая →</div>
          <div className="mt-1 text-sm text-fg-primary transition-colors group-hover:text-accent">
            {next.title}
          </div>
        </Link>
      </nav>
    </main>
  );
}
