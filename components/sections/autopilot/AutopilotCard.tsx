"use client";

import Sensor from "./Sensor";
import Odometer from "./Odometer";
import AutoPilotRing from "./AutoPilotRing";
import { INITIAL_SINCE } from "@/lib/systemStatus";

const LAST_PUBLISH = "сегодня, автоматически";
/** "…и всё равно не пропустил ни одной рассылки" — see the details copy. */
const DELIVERED_PCT = 100;

/** Same anchor as the status line (lib/systemStatus): first evidence of the bots running. */
function daysRunning() {
  const since = INITIAL_SINCE.autopilot;
  return since === null ? 0 : Math.floor((Date.now() - since) / 86_400_000);
}

/** The "on air" panel: both bots' sensors, delivery ring and days running. */
export default function AutopilotCard() {
  return (
    <>
      <div className="flex w-full items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#3ddc6a]">
        <span
          className="decorative-loop inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#3ddc6a]"
          style={{ animation: "status-blink 1.6s ease-in-out infinite" }}
          aria-hidden="true"
        />
        В эфире
      </div>
      <div className="flex items-center gap-4">
        <Sensor blinkDelayMs={0} />
        <Sensor blinkDelayMs={1800} />
        <AutoPilotRing pct={DELIVERED_PCT} label="рассылок без пропусков" />
      </div>
      <div className="w-full border-t border-line pt-4 text-center">
        <div className="text-xs text-fg-muted">Последняя публикация</div>
        <div className="text-sm text-fg-primary">{LAST_PUBLISH}</div>
        <div className="mt-3 text-xs text-fg-muted">Дней в работе</div>
        <Odometer value={daysRunning()} />
      </div>
    </>
  );
}
