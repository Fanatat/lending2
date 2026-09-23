"use client";

import { create } from "zustand";

interface IntroStore {
  /** The boot intro has started handing over and the site is on screen. */
  revealed: boolean;
  reveal: () => void;
}

/**
 * Set by IntroGate the moment the site starts showing through the intro
 * ("Начать" or skip). Page entrance animations (Hero's headline → counter →
 * typed body chain) wait for it, so they play in front of the visitor
 * instead of running out behind the intro.
 */
export const useIntroStore = create<IntroStore>((set) => ({
  revealed: false,
  reveal: () => set({ revealed: true }),
}));
