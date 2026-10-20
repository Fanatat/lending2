"use client";

import { useSystemStatusStore, type Hp100Link, type SystemId } from "@/lib/systemStatus";

const MONTHS = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
];

/** "апрель 2025" — in UTC, so the build server and the visitor's browser print the same thing. */
function monthYear(ms: number) {
  const d = new Date(ms);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function stamp(ms: number | null) {
  if (ms === null) return "";
  return new Date(ms).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const LINK_VIEW: Record<Hp100Link, { color: string; pulse: boolean; label: (updated: number | null) => string }> = {
  checking: { color: "var(--fg-muted)", pulse: false, label: () => "Проверяю связь с платой…" },
  live: { color: "#3ddc6a", pulse: true, label: () => "Плата на связи" },
  stale: {
    color: "#ffc53d",
    pulse: false,
    label: (updated) => `Связь прервана · последнее показание ${stamp(updated)}`,
  },
  offline: { color: "var(--fg-muted)", pulse: false, label: () => "Нет связи с лентой данных" },
};

interface SystemStatusLineProps {
  systemId: SystemId;
  className?: string;
}

/**
 * What each system block can honestly say about itself. Every system shows
 * the date it was verifiably started (lib/systemStatus.ts), when one is
 * known. Only HP100 has a live signal, so only HP100 gets a live indicator —
 * and it tracks the link to the board, not the air: a warm room shows up
 * in the widget's bars, not as "offline".
 */
export default function SystemStatusLine({ systemId, className }: SystemStatusLineProps) {
  const since = useSystemStatusStore((s) => s.status[systemId].since);
  const link = useSystemStatusStore((s) => s.hp100Link);
  const updated = useSystemStatusStore((s) => s.hp100Updated);
  const isHp100 = systemId === "hp100";

  if (!isHp100 && since === null) return null;
  const view = LINK_VIEW[link];

  return (
    <span className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${className ?? ""}`}>
      {isHp100 && (
        <span
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest"
          style={{ color: view.color }}
          role="status"
        >
          <span
            className={view.pulse ? "decorative-loop inline-block h-1.5 w-1.5 shrink-0 rounded-full" : "inline-block h-1.5 w-1.5 shrink-0 rounded-full"}
            style={{
              background: view.color,
              animation: view.pulse ? "status-blink 1.6s ease-in-out infinite" : undefined,
            }}
            aria-hidden="true"
          />
          {view.label(updated)}
        </span>
      )}
      {since !== null && (
        <span className="text-[10px] uppercase tracking-widest text-fg-muted">
          Запущено: {monthYear(since)}
        </span>
      )}
    </span>
  );
}
