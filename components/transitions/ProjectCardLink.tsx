"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { useTransitionStore } from "@/lib/transitionStore";
import { useReducedMotion } from "@/lib/motion";

interface ProjectCardLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  ariaLabel: string;
  /**
   * Pure "read more" links pass this: on the project page itself they'd
   * point at the page you're already on, so they disappear instead.
   */
  hideWhenCurrent?: boolean;
}

const OVERLAY_MS = 550;

/**
 * Makes its children act as a card that navigates to a project page via the
 * "insert cartridge" style zoom-in transition (screen dims, the card's rect
 * expands to fill the viewport, then the route changes underneath it).
 */
export default function ProjectCardLink({
  href,
  children,
  className,
  ariaLabel,
  hideWhenCurrent = false,
}: ProjectCardLinkProps) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const start = useTransitionStore((s) => s.start);
  const reducedMotion = useReducedMotion();
  const current = usePathname() === href;

  function activate() {
    const el = ref.current;
    if (!el || reducedMotion) {
      router.push(href);
      return;
    }
    const r = el.getBoundingClientRect();
    start({ top: r.top, left: r.left, width: r.width, height: r.height });
    window.setTimeout(() => router.push(href), OVERLAY_MS);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate();
    }
  }

  // Widgets are reused on their own project page, where the card must stay
  // a plain block rather than a button that zooms into itself.
  if (current) {
    return hideWhenCurrent ? null : <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      data-cursor="interactive"
      onClick={activate}
      onKeyDown={handleKeyDown}
      className={className}
    >
      {children}
    </div>
  );
}
