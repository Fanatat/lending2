"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, type MouseEvent, type ReactNode } from "react";
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
 * Makes its children a real link to a project page (so it opens in a new
 * tab, can be copied and is visible to search engines), and plays the
 * "insert cartridge" zoom-in on a plain click: screen dims, the card's rect
 * expands to fill the viewport, then the route changes underneath it.
 */
export default function ProjectCardLink({
  href,
  children,
  className,
  ariaLabel,
  hideWhenCurrent = false,
}: ProjectCardLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const router = useRouter();
  const start = useTransitionStore((s) => s.start);
  const reducedMotion = useReducedMotion();
  const current = usePathname() === href;

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    // Modified and middle clicks keep their browser meaning (new tab/window).
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const el = ref.current;
    if (!el || reducedMotion) return;
    e.preventDefault();
    const r = el.getBoundingClientRect();
    start({ top: r.top, left: r.left, width: r.width, height: r.height });
    window.setTimeout(() => router.push(href), OVERLAY_MS);
  }

  // Widgets are reused on their own project page, where the card must stay
  // a plain block rather than a link that zooms into itself.
  if (current) {
    return hideWhenCurrent ? null : <div className={className}>{children}</div>;
  }

  return (
    <Link
      ref={ref}
      href={href}
      aria-label={ariaLabel}
      data-cursor="interactive"
      onClick={handleClick}
      className={className ?? "block"}
    >
      {children}
    </Link>
  );
}
