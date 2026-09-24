import dynamic from "next/dynamic";
import SectionShell from "@/components/sections/SectionShell";
import SystemStatusLine from "@/components/sections/SystemStatusLine";

const HP100Widget = dynamic(() => import("./HP100Widget"), {
  ssr: false,
  loading: () => (
    <div className="h-[260px] w-full max-w-sm border border-line bg-panel" />
  ),
});

export default function HP100Section() {
  return (
    <SectionShell
      id="hp100"
      number="СИСТЕМА 02"
      title="Пока вы в потоке и теряете счёт времени, плата следит за тем, чем вы дышите"
      line={
        <>
          <SystemStatusLine systemId="hp100" offlineLabel="Отклонение" className="mb-3" />
          CO₂ и пыль невидимы, но они отнимают ваши HP. Нос их не чувствует, плата — чувствует. (Вообще-то плате всё равно — это мы научили её беспокоиться.)
        </>
      }
      details="Плата с семью датчиками раз в минуту отправляет на сервер температуру, влажность, давление, освещённость, летучие соединения, пыль трёх фракций и углекислый газ. Когда сервер недоступен, плата замечает это сама, копит показания в собственной памяти и досылает их с настоящими метками времени, как только связь вернулась. Один из датчиков оказался клоном с собственным протоколом: разбирали вручную, стандартные библиотеки его не видят. Схема переносится на теплицу, серверную или любое рабочее место без единой правки в логике."
    >
      <HP100Widget />
    </SectionShell>
  );
}
