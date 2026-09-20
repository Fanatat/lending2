"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Fixed top-left RU/EN pill — mirrors SoundToggle's fixed-corner chrome
 * (bottom-left) and stays clear of EasterEggCounter (top-right).
 */
export default function LocaleSwitch() {
  const pathname = usePathname();
  const isEn = pathname?.startsWith("/en");

  return (
    <div
      className="fixed left-4 top-4 z-40 flex items-center border border-line bg-void text-[10px] tracking-widest"
      aria-label="Язык страницы / page language"
    >
      <Link
        href="/"
        aria-current={!isEn ? "page" : undefined}
        className={`px-2 py-1 transition-colors ${
          !isEn ? "text-accent" : "text-fg-muted hover:text-accent"
        }`}
      >
        RU
      </Link>
      <span className="text-line">/</span>
      <Link
        href="/en"
        aria-current={isEn ? "page" : undefined}
        className={`px-2 py-1 transition-colors ${
          isEn ? "text-accent" : "text-fg-muted hover:text-accent"
        }`}
      >
        EN
      </Link>
    </div>
  );
}
