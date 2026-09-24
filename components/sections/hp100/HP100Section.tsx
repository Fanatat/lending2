import dynamic from "next/dynamic";
import SectionShell from "@/components/sections/SectionShell";
import SystemStatusLine from "@/components/sections/SystemStatusLine";
import { SYSTEM_COPY } from "@/lib/systemCopy";

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
      number={SYSTEM_COPY.hp100.number}
      title={SYSTEM_COPY.hp100.title}
      line={
        <>
          <SystemStatusLine systemId="hp100" offlineLabel="Отклонение" className="mb-3" />
          CO₂ и пыль невидимы, но они отнимают ваши HP. Нос их не чувствует, плата — чувствует. (Вообще-то плате всё равно — это мы научили её беспокоиться.)
        </>
      }
      details={SYSTEM_COPY.hp100.details}
    >
      <HP100Widget />
    </SectionShell>
  );
}
