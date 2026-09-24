"use client";

import SectionShell from "@/components/sections/SectionShell";
import SystemStatusLine from "@/components/sections/SystemStatusLine";
import ProjectCardLink from "@/components/transitions/ProjectCardLink";
import AutopilotCard from "./AutopilotCard";
import { SYSTEM_COPY } from "@/lib/systemCopy";

export default function AutopilotSection() {
  return (
    <SectionShell
      id="channel-autopilot"
      number={SYSTEM_COPY.autopilot.number}
      title={SYSTEM_COPY.autopilot.title}
      line={
        <>
          <SystemStatusLine systemId="autopilot" className="mb-3" />
          Я один раз наполнил папку на 169 000+ фотографий — дальше канал ведёт себя сам: публикует посты днём в непредсказуемое время, чтобы лента не выглядела роботизированной.
        </>
      }
      details={SYSTEM_COPY.autopilot.details}
    >
      <ProjectCardLink
        href="/projects/channel-autopilot"
        ariaLabel="Открыть проект Автопилот канала"
        className="flex w-full max-w-sm flex-col items-center gap-6 border border-line bg-panel p-6"
      >
        <AutopilotCard />
      </ProjectCardLink>
    </SectionShell>
  );
}
