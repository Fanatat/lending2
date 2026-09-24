"use client";

import { useEffect } from "react";
import { usePortfolioGuard, registerPortfolioGuard } from "@/lib/portfolioGuard";
import { useLocale } from "@/lib/locale";

const AUTO_DISMISS_MS = 3500;

/** Console easter egg payoff: `portfolio.readOnly = false` → fullscreen red warning. */
export default function AccessDeniedOverlay() {
  const breach = usePortfolioGuard((s) => s.breach);
  const clear = usePortfolioGuard((s) => s.clear);
  const en = useLocale() === "en";

  useEffect(() => {
    registerPortfolioGuard();
  }, []);

  useEffect(() => {
    if (!breach) return;
    const t = window.setTimeout(clear, AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [breach, clear]);

  if (!breach) return null;

  return (
    <div
      role="alert"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#ff5d5d] px-6 text-center"
    >
      <p className="max-w-lg text-lg font-medium text-[#0a0a0a] sm:text-2xl">
        {en ? "ACCESS DENIED. Python does the maths, not the LLM." : "ДОСТУП ЗАПРЕЩЁН. Числа считает Python, не LLM."}
      </p>
    </div>
  );
}
