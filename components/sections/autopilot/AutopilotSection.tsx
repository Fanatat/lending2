"use client";

import SectionShell from "@/components/sections/SectionShell";
import ProjectCardLink from "@/components/transitions/ProjectCardLink";
import Sensor from "./Sensor";
import Odometer from "./Odometer";

// TODO(автор): реальная дата последнего сбоя/старта системы — сейчас
// заглушка, см. ТЗ раздел 12.
const RUNNING_SINCE = new Date("2025-04-01T00:00:00Z");
const LAST_PUBLISH = "сегодня, автоматически";

function daysSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

export default function AutopilotSection() {
  return (
    <SectionShell
      id="channel-autopilot"
      number="СИСТЕМА 03"
      title="Каналы, которые публикуют и живут без меня"
      line="Наполнил папку со 169 000+ фото, дальше канал через скрипт ведёт себя сам, в непредсказуемое время днём публикует посты, чтобы лента не выглядела роботом."
      details="Два бота. Первый раз в день выкладывает подборку из девяти фотографий с подписью и уводит использованное в архив, чтобы ничего не повторялось. Второй встаёт по расписанию: текст в 5:50, видео в 6:30, материалы собирает заранее сам из каналов-источников и раздаёт по одному в день. У обоих админ-панель прямо в чате: статус, ручной запуск, аналитика по подписчикам, автоматический бэкап базы. Первый работает системной службой месяцами без падений. Второй поднят вручную и всё равно не пропустил ни одной рассылки."
    >
      <ProjectCardLink
        href="/projects/channel-autopilot"
        ariaLabel="Открыть проект Автопилот канала"
        className="flex w-full max-w-sm flex-col items-center gap-6 border border-line bg-panel p-6"
      >
        <div className="flex items-center gap-10">
          <Sensor blinkDelayMs={0} />
          <Sensor blinkDelayMs={1800} />
        </div>
        <div className="w-full border-t border-line pt-4 text-center">
          <div className="text-xs text-fg-muted">Последняя публикация</div>
          <div className="text-sm text-fg-primary">{LAST_PUBLISH}</div>
          <div className="mt-3 text-xs text-fg-muted">Дней без сбоев</div>
          <Odometer value={daysSince(RUNNING_SINCE)} />
        </div>
      </ProjectCardLink>
    </SectionShell>
  );
}
