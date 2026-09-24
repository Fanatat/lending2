"use client";

import { create } from "zustand";
import { useLabStore } from "@/lib/store";
import { playSfx } from "@/lib/sfx";

interface GuardStore {
  breach: boolean;
  trigger: () => void;
  clear: () => void;
}

/** Drives the fullscreen "ДОСТУП ЗАПРЕЩЁН" warning for the `portfolio.readOnly = false` console easter egg. */
export const usePortfolioGuard = create<GuardStore>((set) => ({
  breach: false,
  trigger: () => {
    set({ breach: true });
    useLabStore.getState().markFound("console");
    playSfx("alarm");
  },
  clear: () => set({ breach: false }),
}));

let registered = false;

export function registerPortfolioGuard() {
  if (registered || typeof window === "undefined") return;
  registered = true;

  let readOnly = true;
  const w = window as unknown as {
    portfolio?: { readOnly: boolean };
  };
  // A note for whoever opens DevTools — the entry point to this egg.
  console.log(
    "%cЛюбопытство — хорошее качество.%c\nПортфель на этой странице только для чтения: portfolio.readOnly === true.\nИнтересно, что будет, если это поменять?",
    "color:#ffc53d;font:600 14px monospace",
    "color:#9a9a9a;font:12px monospace"
  );
  Object.defineProperty(w, "portfolio", {
    configurable: true,
    value: {
      get readOnly() {
        return readOnly;
      },
      set readOnly(value: boolean) {
        readOnly = value;
        if (!value) usePortfolioGuard.getState().trigger();
      },
    },
  });
}
