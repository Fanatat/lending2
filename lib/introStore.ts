"use client";

import { create } from "zustand";

/** Set once a visitor has been through the intro; later visits skip the planet parade. */
export const INTRO_SEEN_KEY = "lab-terminal:intro-seen";
/** Added to <html> before hydration when INTRO_SEEN_KEY is set (see app/layout.tsx),
 * so a returning visitor doesn't get a flash of the sound gate. */
export const INTRO_SEEN_HTML_CLASS = "intro-seen-boot";

export function introSeen(): boolean {
  try {
    return window.localStorage.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markIntroSeen() {
  try {
    window.localStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    // localStorage unavailable (private mode) — the parade just plays again next time.
  }
}

interface IntroStore {
  /** The boot intro has started handing over and the site is on screen. */
  revealed: boolean;
  reveal: () => void;
  /** Bumped by "Смотреть интро снова": IntroGate plays the full intro again. */
  replays: number;
  replay: () => void;
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
  replays: 0,
  replay: () => set((s) => ({ replays: s.replays + 1 })),
}));
