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
   * no confirmed date exists yet. StatusLine omits the start date rather
   * than invent one for the ones still `null` — see TODO(автор) below.
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

/** The confirmed start dates alone, for counters outside the status line. */
export const INITIAL_SINCE = Object.fromEntries(
  Object.entries(INITIAL_STATUS).map(([id, s]) => [id, s.since])
) as Record<SystemId, number | null>;

/**
 * HP100's link to its board, as seen through the feed (lib/hp100-live.ts):
 * still waiting for the first answer, fresh reading, only an old reading
 * (the feed bot stopped), or no answer at all. Deliberately separate from
 * the air itself — a warm room is a reading, not an outage.
 */
export type Hp100Link = "checking" | "live" | "stale" | "offline";

interface SystemStatusStore {
  status: Record<SystemId, SystemStatusEntry>;
  hp100Link: Hp100Link;
  /** Epoch ms of the board's latest real reading, once one has arrived. */
  hp100Updated: number | null;
  setHp100Link: (link: Hp100Link, updated: number | null) => void;
}

/**
 * Source of truth for the hero's "N систем работают" tally (SystemsCounter)
 * and each agent's status dot in the Staff section (AgentAvatar). HP100 is
 * the one system wired to a real live signal (see HP100Widget), so it is
 * the only one whose `online` ever changes; the others have no signal to
 * read, which is why their status lines show only the start date and no
 * green "all good" light.
 */
export const useSystemStatusStore = create<SystemStatusStore>((set) => ({
  status: INITIAL_STATUS,
  hp100Link: "checking",
  hp100Updated: null,
  setHp100Link: (link, updated) =>
    set((s) => {
      if (s.hp100Link === link && s.hp100Updated === updated) return s;
      // Until the first answer arrives the board keeps its benefit of the doubt.
      const online = link === "live" || link === "checking";
      return {
        hp100Link: link,
        hp100Updated: updated,
        status: { ...s.status, hp100: { ...s.status.hp100, online } },
      };
    }),
}));
