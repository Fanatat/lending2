"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import SystemStatusLine from "@/components/sections/SystemStatusLine";
import type { ProjectMeta } from "@/lib/projects";

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
 * "Как устроено" pipeline and prev/next navigation between systems.
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
  const router = useRouter();
  const go = (href: string) => () => router.push(href);

  return (
    <main className="min-h-[100svh] px-4 pb-28 pt-16 sm:px-6 md:px-10 lg:px-16">
      <button
        type="button"
        data-cursor="interactive"
        onClick={go(`/#${meta.anchor}`)}
        className="text-xs text-fg-muted transition-colors hover:text-accent"
      >
        ← на дашборд
      </button>

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

      <nav
        aria-label="Другие системы"
        className="mt-16 grid max-w-4xl grid-cols-2 gap-4 border-t border-line pt-8"
      >
        <button
          type="button"
          data-cursor="interactive"
          onClick={go(`/projects/${prev.slug}`)}
          className="group text-left"
        >
          <div className="text-[10px] text-fg-muted">← предыдущая</div>
          <div className="mt-1 text-sm text-fg-primary transition-colors group-hover:text-accent">
            {prev.title}
          </div>
        </button>
        <button
          type="button"
          data-cursor="interactive"
          onClick={go(`/projects/${next.slug}`)}
          className="group text-right"
        >
          <div className="text-[10px] text-fg-muted">следующая →</div>
          <div className="mt-1 text-sm text-fg-primary transition-colors group-hover:text-accent">
            {next.title}
          </div>
        </button>
      </nav>
    </main>
  );
}
