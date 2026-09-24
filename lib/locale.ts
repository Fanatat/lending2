"use client";

import { usePathname } from "next/navigation";
import { BASE_PATH } from "@/lib/site";

export type Locale = "ru" | "en";

function localeOf(path: string | null | undefined): Locale {
  return path === "/en" || path?.startsWith("/en/") ? "en" : "ru";
}

/**
 * The site chrome (sound toggle, easter-egg log, overlays) lives in the root
 * layout and is shared by / and /en, so it picks its language from the
 * route rather than from a prop.
 */
export function useLocale(): Locale {
  return localeOf(usePathname());
}

/** Same, outside React (e.g. a console message printed once on load). */
export function currentLocale(): Locale {
  if (typeof window === "undefined") return "ru";
  const path = window.location.pathname;
  return localeOf(BASE_PATH && path.startsWith(BASE_PATH) ? path.slice(BASE_PATH.length) || "/" : path);
}
