import dynamic from "next/dynamic";
import SectionShell from "@/components/sections/SectionShell";
import SystemStatusLine from "@/components/sections/SystemStatusLine";
import ProjectCardLink from "@/components/transitions/ProjectCardLink";
import Odometer from "@/components/sections/autopilot/Odometer";

const ConveyorBelt = dynamic(() => import("./ConveyorBelt"), {
  ssr: false,
  loading: () => (
    <div className="h-[140px] w-full border border-line bg-panel" />
  ),
});

// TODO(автор): реальные цифры производства — сейчас заглушка на тот же
// случай, что и RUNNING_SINCE в AutopilotSection.
const MATERIALS_RELEASED = 128;
const DEFECT_RATE_PCT = 4;

export default function FactorySection() {
  return (
    <SectionShell
      id="content-factory"
      number="СИСТЕМА 06"
      title="Одна мысль может превратиться в целый сезон мультфильмов на трёх языках"
      line={
        <>
          <SystemStatusLine systemId="factory" className="mb-3" />
          Три канала обслуживает одно производство: сценарий, озвучка и весь материал для монтажа собираются и нумеруются — монтажёру остаётся только творить.
        </>
      }
      details="Система получает тему и дальше идёт сама: пишет историю, разбивает её на сцены, заводит персонажей и окружения, раскладывает по кадрам, собирает описания картинок, генерирует изображения, озвучивает, монтирует и выгружает почти готовый материал — остаётся лишь собрать ролик в Premiere. История пишется один раз в каноническом виде, английская, испанская и русская версии собираются из неё как производные. Двенадцать настоящих роликов уже собраны от начала до конца. Вся генерация идёт на обычном домашнем компьютере, без подписок и API — включая этап проверки, где LLM сама следит, чтобы сценарий шёл по плану, персонажи на картинках не менялись, а общий антураж сохранялся. Так можно параллельно вести несколько мультсериалов."
    >
      <div className="flex w-full flex-col items-center gap-3">
        <ConveyorBelt />
        <div className="flex w-full max-w-sm items-center justify-center gap-8 border-t border-line pt-3 text-center">
          <div>
            <div className="text-[10px] text-fg-muted">Материалов выпущено</div>
            <Odometer value={MATERIALS_RELEASED} />
          </div>
          <div>
            <div className="text-[10px] text-fg-muted">Брак</div>
            <div className="text-2xl font-bold text-fg-primary">{DEFECT_RATE_PCT}%</div>
          </div>
        </div>
        <ProjectCardLink
          href="/projects/content-factory"
          ariaLabel="Открыть проект Контент-завод"
          className="text-[10px] text-accent"
        >
          Примеры материалов и архитектура промптов →
        </ProjectCardLink>
      </div>
    </SectionShell>
  );
}
