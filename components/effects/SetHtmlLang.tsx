"use client";

import { useEffect } from "react";

/** Sets <html lang> on mount — the root layout hardcodes "ru" since a single
 * <html> is shared across locales; /en overrides it client-side instead of
 * forking the root layout for one attribute. */
export default function SetHtmlLang({ lang }: { lang: string }) {
  useEffect(() => {
    const prev = document.documentElement.lang;
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = prev;
    };
  }, [lang]);
  return null;
}
