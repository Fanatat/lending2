import SectionShell from "@/components/sections/SectionShell";
import SystemStatusLine from "@/components/sections/SystemStatusLine";
import CartridgeGrid from "./CartridgeGrid";
import { SYSTEM_COPY } from "@/lib/systemCopy";

export default function FridaySection() {
  return (
    <SectionShell
      id="friday-studio"
      number={SYSTEM_COPY.friday.number}
      title={SYSTEM_COPY.friday.title}
      line={
        <>
          <SystemStatusLine systemId="friday" className="mb-3" />
          Полный цикл — от чистого и быстрого кода до промо-роликов. Пока конкурент грузит мегабайты фреймворка, наша игра уже приняла первый ход игрока.
        </>
      }
      details={SYSTEM_COPY.friday.details}
    >
      <CartridgeGrid />
    </SectionShell>
  );
}
