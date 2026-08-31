"use client";

import { create } from "zustand";

export interface TransitionRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TransitionStore {
  active: boolean;
  rect: TransitionRect | null;
  start: (rect: TransitionRect) => void;
  reset: () => void;
}

/**
 * Drives the "zoom into the selected card" transition into a project page
 * (see components/transitions/ProjectTransitionOverlay.tsx). The overlay
 * lives in the root layout so it survives the route change: it expands from
 * the clicked card's rect to fill the screen, the new page mounts
 * underneath, then it fades out.
 */
export const useTransitionStore = create<TransitionStore>((set) => ({
  active: false,
  rect: null,
  start: (rect) => set({ active: true, rect }),
  reset: () => set({ active: false, rect: null }),
}));
