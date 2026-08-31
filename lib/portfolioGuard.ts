"use client";

import { create } from "zustand";

interface GuardStore {
  breach: boolean;
  trigger: () => void;
  clear: () => void;
}

/** Drives the fullscreen "ДОСТУП ЗАПРЕЩЁН" warning for the `portfolio.readOnly = false` console easter egg. */
export const usePortfolioGuard = create<GuardStore>((set) => ({
  breach: false,
  trigger: () => set({ breach: true }),
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
