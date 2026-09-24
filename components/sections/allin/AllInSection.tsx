import SectionShell from "@/components/sections/SectionShell";
import SystemStatusLine from "@/components/sections/SystemStatusLine";
import PortfolioWidget from "./PortfolioWidget";
import PortfolioHealthCard from "./PortfolioHealthCard";
import { SYSTEM_COPY } from "@/lib/systemCopy";

export default function AllInSection() {
  return (
    <SectionShell
      id="all-in"
      number={SYSTEM_COPY.allin.number}
      title={SYSTEM_COPY.allin.title}
      line={
        <>
          <SystemStatusLine systemId="allin" className="mb-3" />
          Аналитика криптопортфеля, которая видит, где рынок наказывает жадных: ситуацию на рынке, ваши активы, сравнение инструментов и математику рисков. А вот нажать «Купить» она не может — так устроена.
        </>
      }
      details={SYSTEM_COPY.allin.details}
      footnote="что?"
    >
      <div className="flex flex-wrap items-start justify-center gap-4">
        <PortfolioWidget />
        <PortfolioHealthCard />
      </div>
    </SectionShell>
  );
}
