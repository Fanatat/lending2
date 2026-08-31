import SectionShell from "@/components/sections/SectionShell";
import ProjectCardLink from "@/components/transitions/ProjectCardLink";
import BridgeDiagram from "./BridgeDiagram";

export default function BridgeSection() {
  return (
    <SectionShell
      id="bridge"
      number="СИСТЕМА 04"
      title="Фикс для приближающегося рунета."
      line="Мост соединяет SOCKS5 с HTTP и возвращает Telegram Desktop в рабочее состояние за пару минут."
      details="Локальный сервер поднимается на компьютере и берёт на себя всю грязную работу: авторизацию, туннелирование, разбор соединений, с логом каждого из них. Инструкция построена как нормальная диагностика, от дешёвого к дорогому: сначала две галочки в настройках самого приложения, и только если это не помогло, запускается мост. Работает системной службой, самотест зелёный. Задача типовая: так же лечится любое приложение, которое понимает один протокол, а у вас оплачен и доступен другой."
    >
      <div className="flex flex-col items-center gap-3">
        <BridgeDiagram />
        <ProjectCardLink
          href="/projects/bridge"
          ariaLabel="Открыть проект Мост"
          className="text-[10px] text-accent"
        >
          Лог соединений и архитектура →
        </ProjectCardLink>
      </div>
    </SectionShell>
  );
}
