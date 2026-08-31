import dynamic from "next/dynamic";
import SectionShell from "@/components/sections/SectionShell";
import ProjectCardLink from "@/components/transitions/ProjectCardLink";

const ConveyorBelt = dynamic(() => import("./ConveyorBelt"), {
  ssr: false,
  loading: () => (
    <div className="h-[140px] w-full border border-line bg-panel" />
  ),
});

export default function FactorySection() {
  return (
    <SectionShell
      id="content-factory"
      number="СИСТЕМА 06"
      title="Одна мысль может превратиться в целый сезон мультфильмов на трёх языках"
      line="Три канала обслуживаются одним производством: сценарий, озвучка и весь материал для монтажа собираются и нумеруются для оператора, который уже волен творить."
      details="Система получает тему и дальше идёт сама: пишет историю, разбивает её на сцены, заводит персонажей и окружения, раскладывает по кадрам, собирает описания картинок, генерирует изображения, озвучивает, монтирует и выгружает почти готовый материал, остается лишь собрать в Premiere. История пишется один раз в каноническом виде, английская, испанская и русская версии собираются из неё как производные. Двенадцать настоящих роликов уже собраны от начала до конца. Вся генерация и работа проходят на обычном домашнем компьютере, без подписок и API, в том числе и этап проверки, где LLM сама проверяет себя, что сценарий идет по плану, что персонажи на картинках не стали другими и общий антураж сохранен. И так можно параллельно вести несколько мультсериалов."
    >
      <div className="flex w-full flex-col items-center gap-3">
        <ConveyorBelt />
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
