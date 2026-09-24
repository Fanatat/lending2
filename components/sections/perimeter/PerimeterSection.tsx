import dynamic from "next/dynamic";
import SectionShell from "@/components/sections/SectionShell";
import SystemStatusLine from "@/components/sections/SystemStatusLine";
import { SYSTEM_COPY } from "@/lib/systemCopy";

const PerimeterMap = dynamic(() => import("./PerimeterMap"), {
  ssr: false,
  loading: () => (
    <div className="aspect-square w-full max-w-sm border border-line bg-panel" />
  ),
});

export default function PerimeterSection() {
  return (
    <SectionShell
      id="perimeter"
      number={SYSTEM_COPY.perimeter.number}
      title={SYSTEM_COPY.perimeter.title}
      line={
        <>
          <SystemStatusLine systemId="perimeter" className="mb-3" />
          Автономная система проверяет сеть на утечки данных и несанкционированное проникновение. Действовать самостоятельно ей запрещено — только с разрешения основателя.
        </>
      }
      details={SYSTEM_COPY.perimeter.details}
    >
      <PerimeterMap />
    </SectionShell>
  );
}
