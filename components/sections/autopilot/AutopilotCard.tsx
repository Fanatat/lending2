"use client";

import { useEffect, useState } from "react";
import Sensor from "./Sensor";
import Odometer from "./Odometer";
import AutoPilotRing from "./AutoPilotRing";
import { INITIAL_SINCE } from "@/lib/systemStatus";

/** Straight from the details copy: text at 5:50, video at 6:30. */
const SCHEDULE = "текст 5:50 · видео 6:30";
/** "…и всё равно не пропустил ни одной рассылки" — see the details copy. */
const DELIVERED_PCT = 100;

/** Same anchor as the status line (lib/systemStatus): first evidence of the bots running. */
function daysRunning() {
  const since = INITIAL_SINCE.autopilot;
  return since === null ? 0 : Math.floor((Date.now() - since) / 86_400_000);
}

/**
 * The bots' panel: both sensors, delivery ring, schedule and days running.
 * None of it is telemetry — the bots don't report to this site — so the
 * card says so instead of posing as a live feed.
 */
export default function AutopilotCard() {
  // Counted in the browser: the page is pre-rendered, and a day count baked
  // in at build time would disagree with the visitor's (hydration error).
  const [days, setDays] = useState(0);
  useEffect(() => setDays(daysRunning()), []);

  return (
    <>
      <div className="w-full text-[10px] uppercase tracking-widest text-fg-muted">
        Два бота
      </div>
      <div className="flex items-center gap-4">
        <Sensor blinkDelayMs={0} />
        <Sensor blinkDelayMs={1800} />
        <AutoPilotRing pct={DELIVERED_PCT} label="рассылок без пропусков" />
      </div>
      <div className="w-full border-t border-line pt-4 text-center">
        <div className="text-xs text-fg-muted">Расписание</div>
        <div className="text-sm text-fg-primary">{SCHEDULE}</div>
        <div className="mt-3 text-xs text-fg-muted">Дней в работе</div>
        <Odometer value={days} />
        <p className="mt-3 text-[10px] leading-relaxed text-fg-muted">
          Сводка вручную, не живая телеметрия: боты не отправляют данные
          на этот сайт.
        </p>
      </div>
    </>
  );
}
