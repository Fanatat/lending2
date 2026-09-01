// TODO(автор): реальные имена, характеры и связи агентов — сейчас
// заглушка, привязанная к уже описанным системам. См. ТЗ раздел 12, п.4.
export interface Agent {
  id: string;
  initials: string;
  name: string;
  status: string;
}

export const AGENTS: Agent[] = [
  { id: "coordinator", initials: "ШТ", name: "Координатор", status: "Штаб" },
  { id: "friday", initials: "ПТ", name: "Менеджер", status: "game4 / Пятница" },
  { id: "hp100", initials: "HP", name: "Дежурный", status: "датчики HP100" },
  { id: "autopilot", initials: "АП", name: "Смотритель", status: "каналы" },
  { id: "bridge", initials: "МТ", name: "Инженер связи", status: "Мост" },
  { id: "allin", initials: "OI", name: "Аналитик рисков", status: "All in" },
  { id: "factory", initials: "КЗ", name: "Продюсер сцен", status: "Контент-завод" },
  { id: "perimeter", initials: "ПР", name: "Служба безопасности", status: "Периметр" },
];

export const HUB_ID = "coordinator";

export const CANNED_REPLIES: Record<string, string[]> = {
  coordinator: [
    "Принял. Распределяю по отделам.",
    "Все восемь на связи, фокус держим.",
  ],
  friday: ["338 тестов зелёных, можно катить релиз.", "Промо-ролик уже монтируется."],
  hp100: ["CO2 в норме. Дышите спокойно.", "Датчик-клон опять чудит, разбираюсь."],
  autopilot: ["Публикация ушла по расписанию.", "Архив пополнен, повторов не будет."],
  bridge: ["Самотест зелёный.", "IPv6 в порядке, мост держит соединение."],
  allin: ["Сигналов не даю, только цифры.", "Просадка в пределах нормы."],
  factory: ["Двенадцать роликов готово, ведём тринадцатый.", "Сценарий прошёл самопроверку."],
  perimeter: ["Периметр закрыт.", "Свежих утечек не найдено."],
};
