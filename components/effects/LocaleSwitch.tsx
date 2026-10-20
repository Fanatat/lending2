"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TELEGRAM_URL } from "@/lib/site";

/**
 * Fixed top-left RU/EN pill plus a "write to me" link, so contacting the
 * author never takes more than one click from any page — mirrors
 * SoundToggle's fixed-corner chrome (bottom-left) and stays clear of
 * EasterEggCounter (top-right).
 */
export default function LocaleSwitch() {
  const pathname = usePathname();
  const isEn = pathname?.startsWith("/en");

  return (
    <div className="fixed left-4 top-4 z-40 flex items-center gap-2 text-[10px] tracking-widest">
      <div
        className="flex items-center border border-line bg-void"
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
      <a
        href={TELEGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        data-cursor="interactive"
        aria-label={isEn ? "Message me on Telegram" : "Написать в Telegram"}
        className="border border-accent bg-void px-2 py-1 text-accent transition-[filter] duration-200 hover:[filter:drop-shadow(0_0_6px_var(--accent))]"
      >
        {isEn ? "Message ↗" : "Написать ↗"}
      </a>
    </div>
  );
}
