"use client";

import { create } from "zustand";

export type SystemId =
  | "friday"
  | "hp100"
  | "autopilot"
  | "bridge"
  | "allin"
  | "factory"
  | "staff"
  | "perimeter";

export interface SystemStatusEntry {
  online: boolean;
  /**
   * Epoch ms this system has been verifiably running since, or `null` when
   * no confirmed date exists yet. StatusLine omits the uptime line rather
   * than invent a number for the ones still `null` — see TODO(автор) below.
   */
  since: number | null;
}

// Anchor dates below are real, not invented — each one is the earliest
// evidence found of that system actually running (first commit, oldest
// surviving file, etc.) at the time this was wired up. Two systems still
// have no confirmed date and stay `null` on purpose: fill them in once you
// have the real number, don't guess one in.
const INITIAL_STATUS: Record<SystemId, SystemStatusEntry> = {
  // TODO(автор): дата запуска студии «Пятница» — заполнить.
  friday: { online: true, since: null },
  hp100: { online: true, since: Date.parse("2026-06-07T00:00:00Z") },
  autopilot: { online: true, since: Date.parse("2025-04-01T00:00:00Z") },
  bridge: { online: true, since: Date.parse("2026-08-24T00:00:00Z") },
  allin: { online: true, since: Date.parse("2026-08-25T00:00:00Z") },
  // TODO(автор): контент-завод работает на домашнем ПК, вне этого сервера —
  // точную дату запуска знает только автор, заполнить вручную.
  factory: { online: true, since: null },
  staff: { online: true, since: Date.parse("2026-05-18T00:00:00Z") },
  perimeter: { online: true, since: Date.parse("2026-08-28T00:00:00Z") },
};

interface SystemStatusStore {
  status: Record<SystemId, SystemStatusEntry>;
  setOnline: (id: SystemId, online: boolean) => void;
}

/**
 * Single source of truth for the "Норма" pulsing indicator duplicated across
 * every system block (see SystemStatusLine) and for each agent's status dot
 * in the Staff section (see AgentAvatar) — flipping one system's `online`
 * flag here updates both places at once instead of two separately-maintained
 * stubs drifting apart. HP100 is the one system wired to a real live signal
 * (see HP100Widget); the rest default to `online: true` and are meant to be
 * flipped by hand the day a system actually goes down.
 */
export const useSystemStatusStore = create<SystemStatusStore>((set) => ({
  status: INITIAL_STATUS,
  setOnline: (id, online) =>
    set((s) => {
      const current = s.status[id];
      if (current.online === online) return s;
      return { status: { ...s.status, [id]: { ...current, online } } };
    }),
}));
