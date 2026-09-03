"use client";

import { create } from "zustand";

export interface FallingPacket {
  id: number;
  x: number;
  y: number;
  unicorn: boolean;
}

export interface PiledPacket {
  id: number;
  unicorn: boolean;
  evicting: boolean;
}

const PILE_LIMIT = 100;

interface BridgeStore {
  falling: FallingPacket[];
  piled: PiledPacket[];
  spawnFalling: (x: number, y: number, unicorn: boolean) => void;
  land: (id: number, unicorn: boolean) => void;
  evict: (id: number) => void;
}

let nextId = 1;

/**
 * Tracks packets that have fallen off the broken "Мост" pipe: they trip and
 * drop right there (see PacketPile's FallingPacket), then join a pile at the
 * bottom of the viewport — a persistent, self-ironic tally of the IPv6
 * misconfiguration that survives scrolling away from the section.
 *
 * The pile is a rolling window of the last PILE_LIMIT packets rather than a
 * bare counter: past the limit, the oldest entry is flagged `evicting` so it
 * can fade out in PacketPile instead of the whole pile snapping back to a
 * shorter length.
 */
export const useBridgeStore = create<BridgeStore>((set) => ({
  falling: [],
  piled: [],
  spawnFalling: (x, y, unicorn) =>
    set((s) => ({
      falling:
        s.falling.length >= 60
          ? s.falling
          : [...s.falling, { id: nextId++, x, y, unicorn }],
    })),
  land: (id, unicorn) =>
    set((s) => {
      if (!s.falling.some((p) => p.id === id)) return s;
      const falling = s.falling.filter((p) => p.id !== id);
      const piled = [...s.piled, { id: nextId++, unicorn, evicting: false }];
      const overflow = piled.length - PILE_LIMIT;
      const trimmed =
        overflow > 0
          ? piled.map((p, i) => (i < overflow ? { ...p, evicting: true } : p))
          : piled;
      return { falling, piled: trimmed };
    }),
  evict: (id) => set((s) => ({ piled: s.piled.filter((p) => p.id !== id) })),
}));
