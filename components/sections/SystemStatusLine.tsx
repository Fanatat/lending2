"use client";

import { useSystemStatusStore, type SystemId } from "@/lib/systemStatus";

const ONLINE_COLOR = "#3ddc6a";
const OFFLINE_COLOR = "#ff5d5d";

function daysWord(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "дня";
  return "дней";
}

interface SystemStatusLineProps {
  systemId: SystemId;
  /** Label shown while online — defaults to "Норма". */
  onlineLabel?: string;
  /** Label shown while offline — defaults to "Не в сети". */
  offlineLabel?: string;
  className?: string;
}

/**
 * Pulsing status dot + label + uptime, shared by every system block so the
 * indicator actually means something (flip a system's `online` flag in
 * lib/systemStatus.ts and every place that reads it — including the Staff
 * agent grid — updates together) instead of each section hand-rolling its
 * own permanently-green decoration.
 */
export default function SystemStatusLine({
  systemId,
  onlineLabel = "Норма",
  offlineLabel = "Не в сети",
  className,
}: SystemStatusLineProps) {
  const entry = useSystemStatusStore((s) => s.status[systemId]);
  const color = entry.online ? ONLINE_COLOR : OFFLINE_COLOR;
  const days =
    entry.since !== null ? Math.floor((Date.now() - entry.since) / 86_400_000) : null;

  return (
    <span className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${className ?? ""}`}>
      <span
        className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest"
        style={{ color }}
      >
        <span
          className={entry.online ? "decorative-loop inline-block h-1.5 w-1.5 shrink-0 rounded-full" : "inline-block h-1.5 w-1.5 shrink-0 rounded-full"}
          style={{
            background: color,
            animation: entry.online ? "status-blink 1.6s ease-in-out infinite" : undefined,
          }}
          aria-hidden="true"
        />
        {entry.online ? onlineLabel : offlineLabel}
      </span>
      {days !== null && (
        <span className="text-[10px] text-fg-muted">
          Uptime: {days} {daysWord(days)}
        </span>
      )}
    </span>
  );
}
