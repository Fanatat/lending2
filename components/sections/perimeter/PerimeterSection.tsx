import dynamic from "next/dynamic";
import SectionShell from "@/components/sections/SectionShell";
import SystemStatusLine from "@/components/sections/SystemStatusLine";

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
      number="СИСТЕМА 08"
      title="ИИ ошибается даже в правильных руках. Нужен контролирующий орган."
      line={
        <>
          <SystemStatusLine systemId="perimeter" className="mb-3" />
          Автономная система проверяет сеть на утечки данных и несанкционированное проникновение. Действовать самостоятельно ей запрещено — только с разрешения основателя.
        </>
      }
      details="Полная проверка локальной сети на внутренние и внешние угрозы: снаружи белый адрес ведёт прямо на роутер, а за ним стоят четыре равнозначных устройства — сервер, ПК, неттоп и ноутбук. Сетевая папка сервера месяцами раздавала на чтение весь домашний каталог, а в нём лежали ключ биржи и токены ботов. Один компьютер отдавал профиль пользователя анонимно, без пароля. Отдельно в отчёт попал случай, когда черновики самого аудита один раз сохранили часть секретов открытым текстом в ту же раздаваемую папку: неудобный факт остался в документе. Самым полезным в работе оказался порядок действий. Сначала закрыть двери, потом менять секреты, и делать это с заведомо чистого устройства."
    >
      <PerimeterMap />
    </SectionShell>
  );
}
