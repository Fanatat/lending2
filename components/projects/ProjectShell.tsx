"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface ProjectShellProps {
  title: string;
  todo: string;
  children?: ReactNode;
}

/** Shared chrome for /projects/[slug] pages: back navigation, title, TODO badge. */
export default function ProjectShell({ title, todo, children }: ProjectShellProps) {
  const router = useRouter();

  return (
    <main className="min-h-screen px-6 py-16 sm:px-10 md:px-16">
      <button
        type="button"
        data-cursor="interactive"
        onClick={() => router.push("/")}
        className="text-xs text-fg-muted transition-colors hover:text-accent"
      >
        ← на дашборд
      </button>

      <h1 className="mt-8 max-w-2xl text-3xl text-fg-primary sm:text-4xl">
        {title}
      </h1>

      <div className="mt-4 inline-block border border-line px-3 py-1 text-[10px] text-fg-muted">
        TODO(автор): {todo}
      </div>

      <div className="mt-10 max-w-2xl">{children}</div>
    </main>
  );
}
