"use client";

import { create } from "zustand";

export interface FallRequest {
  /** Viewport coordinates of the gap the runner fell through. */
  x: number;
  y: number;
  unicorn: boolean;
}

interface BridgeStore {
  /** Runners that have landed on the heap at the bottom of the page. */
  landed: number;
  /** Bumped to ask CrowdFall to sweep the heap away. */
  sweepToken: number;
  addLanded: () => void;
  sweep: () => void;
}

/**
 * The broken "Мост" drops its little runners through the gap: they fall the
 * whole length of the page and pile up at the very bottom (CrowdFall owns
 * the physics). Spawns go through a plain queue rather than React state —
 * they're consumed by CrowdFall's animation loop, not rendered — and the
 * store only keeps what the UI shows (the heap count, the sweep button).
 */
const queue: FallRequest[] = [];

export function requestFall(req: FallRequest) {
  if (queue.length < 40) queue.push(req);
}

export function drainFalls(): FallRequest[] {
  return queue.splice(0, queue.length);
}

export const useBridgeStore = create<BridgeStore>((set) => ({
  landed: 0,
  sweepToken: 0,
  addLanded: () => set((s) => ({ landed: s.landed + 1 })),
  sweep: () => set((s) => ({ landed: 0, sweepToken: s.sweepToken + 1 })),
}));
