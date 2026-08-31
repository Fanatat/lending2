"use client";

import { create } from "zustand";

export type EasterEggId = "matrix" | "unicorn" | "branch";

const STORAGE_KEY = "lab-terminal:found-easter-eggs";

function loadFound(): EasterEggId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistFound(ids: EasterEggId[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage unavailable (private mode, quota) — easter eggs just won't persist.
  }
}

const SOUND_KEY = "lab-terminal:sound-enabled";

function loadSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(SOUND_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

interface LabStore {
  matrixMode: boolean;
  unicornMode: boolean;
  foundEasterEggs: EasterEggId[];
  soundEnabled: boolean;
  setMatrixMode: (on: boolean) => void;
  setUnicornMode: (on: boolean) => void;
  markFound: (id: EasterEggId) => void;
  hydrateFromStorage: () => void;
  toggleSound: () => void;
}

export const useLabStore = create<LabStore>((set, get) => ({
  matrixMode: false,
  unicornMode: false,
  foundEasterEggs: [],
  soundEnabled: true,
  setMatrixMode: (on) => set({ matrixMode: on }),
  setUnicornMode: (on) => set({ unicornMode: on }),
  markFound: (id) => {
    const current = get().foundEasterEggs;
    if (current.includes(id)) return;
    const next = [...current, id];
    set({ foundEasterEggs: next });
    persistFound(next);
  },
  hydrateFromStorage: () => {
    // `found` is a permanent "discovered this egg once" record used for
    // achievement tracking — it must not double as the live matrixMode
    // toggle, or the mint/matrix look would come back on every visit after
    // the first time someone finds it instead of needing the 5-click trigger
    // again.
    const found = loadFound();
    set({
      foundEasterEggs: found,
      soundEnabled: loadSoundEnabled(),
    });
  },
  toggleSound: () => {
    const next = !get().soundEnabled;
    set({ soundEnabled: next });
    try {
      window.localStorage.setItem(SOUND_KEY, next ? "1" : "0");
    } catch {
      // ignore
    }
  },
}));
