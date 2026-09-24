import type { SystemId } from "@/lib/systemStatus";

export interface Agent {
  id: string;
  initials: string;
  name: string;
  status: string;
  /** Drives this agent's status dot — see lib/systemStatus.ts. Coordinator
   * has no dedicated system section, so it mirrors the Staff system itself. */
  systemId: SystemId;
}

export const AGENTS: Agent[] = [
  { id: "coordinator", initials: "ШТ", name: "Координатор", status: "Штаб", systemId: "staff" },
  { id: "friday", initials: "ПТ", name: "Менеджер", status: "game4 / Пятница", systemId: "friday" },
  { id: "hp100", initials: "HP", name: "Дежурный", status: "датчики HP100", systemId: "hp100" },
  { id: "autopilot", initials: "АП", name: "Смотритель", status: "каналы", systemId: "autopilot" },
  { id: "bridge", initials: "МТ", name: "Инженер связи", status: "Мост", systemId: "bridge" },
  { id: "allin", initials: "OI", name: "Аналитик рисков", status: "All in", systemId: "allin" },
  { id: "factory", initials: "КЗ", name: "Продюсер сцен", status: "Контент-завод", systemId: "factory" },
  { id: "perimeter", initials: "ПР", name: "Служба безопасности", status: "Периметр", systemId: "perimeter" },
];

export const HUB_ID = "coordinator";

export const CANNED_REPLIES: Record<string, string[]> = {
  coordinator: [
    "Принял. Распределяю по отделам.",
    "Все восемь на связи, фокус держим.",
  ],
  friday: ["338 тестов зелёных, можно катить релиз.", "Промо-ролик уже монтируется."],
  hp100: ["CO₂ в норме. Дышите спокойно.", "Датчик-клон опять чудит, разбираюсь."],
  autopilot: ["Публикация ушла по расписанию.", "Архив пополнен, повторов не будет."],
  bridge: ["Самотест зелёный.", "IPv6 в порядке, мост держит соединение."],
  allin: ["Сигналов не даю, только цифры.", "Просадка в пределах нормы."],
  factory: ["Двенадцать роликов готово, ведём тринадцатый.", "Сценарий прошёл самопроверку."],
  perimeter: ["Периметр закрыт.", "Свежих утечек не найдено."],
};

/** Replies steered by a keyword topic (see StaffChatSim); agents without an entry fall back to CANNED_REPLIES. */
export const TOPIC_REPLIES: Record<string, Partial<Record<string, string[]>>> = {
  greet: {
    coordinator: ["Здравствуйте. Штаб на связи, слушаю."],
    friday: ["Привет! Если вы по поводу релиза — он уже вышел."],
    hp100: ["Здравствуйте. В комнате всё в норме, проветривать пока не нужно."],
    autopilot: ["Добрый. Каналы работают, я наблюдаю."],
    bridge: ["На связи. Пинг хороший."],
    allin: ["Здравствуйте. Сразу скажу: сигналов я не даю."],
    factory: ["Привет! Вы как раз между двумя сценами."],
    perimeter: ["Здравствуйте. Ваш IP я уже записал. Шучу. Почти."],
  },
  status: {
    coordinator: ["Все восемь систем в строю, происшествий нет."],
    friday: ["Тесты зелёные, сборка свежая."],
    hp100: ["Датчики отвечают, CO₂ под порогом."],
    autopilot: ["Очередь публикаций заполнена на неделю вперёд."],
    bridge: ["Мост держит, самотест пройден."],
    allin: ["Риск в лимите, стоп-лоссы на месте."],
    factory: ["Конвейер крутится, следующий ролик в работе."],
    perimeter: ["Периметр закрыт, новых утечек нет."],
  },
  money: {
    coordinator: ["Весь штаб обходится в 2 000 ₽ в месяц. Расклад в конце страницы."],
    allin: ["Деньги считаю я. Советов не даю, только цифры."],
    bridge: ["Прокси стоит 200 ₽. Самая дешёвая строка в бюджете и самая нервная."],
    factory: ["Я укладываюсь в те же 2 000 ₽, что и все остальные."],
  },
  thanks: {
    coordinator: ["Передам отделам. Им приятно, хотя они и не покажут."],
    hp100: ["Пожалуйста. Не забывайте проветривать."],
    perimeter: ["Благодарность принята и проверена на вирусы."],
  },
  whoami: {
    coordinator: ["Агент. У меня есть имя, характер и своя зона памяти. Отпуска нет."],
    friday: ["Менеджер без выходных. Мой рабочий день кончается, когда кончаются тесты."],
    perimeter: ["Служба безопасности. Больше ничего сказать не могу."],
  },
};

/** /party: who speaks and in what order. */
export const PARTY_LINES: [string, string][] = [
  ["coordinator", "Официально: десять минут перерыва. Неофициально: пока я не замечу."],
  ["friday", "Включаю музыку из промо-ролика. Да, опять ту самую."],
  ["factory", "Сниму это. Выйдет отличный эпизод."],
  ["hp100", "CO₂ растёт. Вы что, танцуете?"],
  ["bridge", "Раздаю всем IPv6. Бесплатно, только сегодня."],
  ["allin", "Ставлю всё на то, что Координатор не выдержит и пяти минут."],
  ["autopilot", "Поставил в отложку пост «Штаб отдыхает». Выйдет через час."],
  ["perimeter", "Дверь закрыта, гостей не ждём. Веселимся безопасно."],
];
