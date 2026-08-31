"use client";

import { create } from "zustand";

export interface FallingPacket {
  id: number;
  x: number;
  y: number;
  unicorn: boolean;
}

interface BridgeStore {
  fallenCount: number;
  falling: FallingPacket[];
  spawnFalling: (x: number, y: number, unicorn: boolean) => void;
  land: (id: number) => void;
}

let nextId = 1;

/**
 * Tracks packets that have fallen off the broken "Мост" pipe: spawned at a
 * fixed screen position, they fall to the bottom of the viewport and join
 * the static pile there — rendered globally so both the fall and the pile
 * survive scrolling away from the section (see
 * components/effects/PacketPile.tsx).
 */
export const useBridgeStore = create<BridgeStore>((set) => ({
  fallenCount: 0,
  falling: [],
  spawnFalling: (x, y, unicorn) =>
    set((s) => ({
      falling:
        s.falling.length >= 60
          ? s.falling
          : [...s.falling, { id: nextId++, x, y, unicorn }],
    })),
  land: (id) =>
    set((s) => ({
      falling: s.falling.filter((p) => p.id !== id),
      fallenCount: Math.min(200, s.fallenCount + 1),
    })),
}));
