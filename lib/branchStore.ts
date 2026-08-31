"use client";

import { create } from "zustand";

interface BranchStore {
  open: boolean;
  foundIds: string[];
  setOpen: (v: boolean) => void;
  markFoundSilhouette: (id: string) => void;
  reset: () => void;
}

export const useBranchStore = create<BranchStore>((set, get) => ({
  open: false,
  foundIds: [],
  setOpen: (v) => set({ open: v }),
  markFoundSilhouette: (id) => {
    if (get().foundIds.includes(id)) return;
    set({ foundIds: [...get().foundIds, id] });
  },
  reset: () => set({ foundIds: [] }),
}));
