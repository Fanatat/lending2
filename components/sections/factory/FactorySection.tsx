import dynamic from "next/dynamic";
import SectionShell from "@/components/sections/SectionShell";
import SystemStatusLine from "@/components/sections/SystemStatusLine";
import ProjectCardLink from "@/components/transitions/ProjectCardLink";
import Odometer from "@/components/sections/autopilot/Odometer";
import { SYSTEM_COPY } from "@/lib/systemCopy";

const ConveyorBelt = dynamic(() => import("./ConveyorBelt"), {
  ssr: false,
  loading: () => (
    <div className="h-[140px] w-full border border-line bg-panel" />
  ),
});

/** Both straight from the details copy: twelve finished videos, three languages. */
const VIDEOS_FINISHED = 12;
const LANGUAGES = 3;

export default function FactorySection() {
  return (
    <SectionShell
      id="content-factory"
      number={SYSTEM_COPY.factory.number}
      title={SYSTEM_COPY.factory.title}
      line={
        <>
          <SystemStatusLine systemId="factory" className="mb-3" />
          Три канала обслуживает одно производство: сценарий, озвучка и весь материал для монтажа собираются и нумеруются — монтажёру остаётся только творить.
        </>
      }
      details={SYSTEM_COPY.factory.details}
    >
      <div className="flex w-full flex-col items-center gap-3">
        <ConveyorBelt />
        <div className="flex w-full max-w-sm items-center justify-center gap-8 border-t border-line pt-3 text-center">
          <div>
            <div className="text-[10px] text-fg-muted">Роликов собрано целиком</div>
            <Odometer value={VIDEOS_FINISHED} />
          </div>
          <div>
            <div className="text-[10px] text-fg-muted">Языка из одной истории</div>
            <div className="text-2xl font-bold text-fg-primary">{LANGUAGES}</div>
          </div>
        </div>
        <ProjectCardLink
          href="/projects/content-factory"
          ariaLabel="Открыть проект Контент-завод"
          className="text-[10px] text-accent"
        >
          Как устроен конвейер →
        </ProjectCardLink>
      </div>
    </SectionShell>
  );
}
