/**
 * The studio as a whole: player count, the game pipeline, the servers and
 * the services behind the games. Shared by the RU dashboard and the EN
 * page so the two can never tell different stories.
 *
 * Every figure here has a source — update it from the same source, don't
 * round it up:
 * - players: the VK developer cabinet, "Участники (лайфтайм)" summed over
 *   the four published games (export of 2026-10-10: 1058 + 1474 + 474 +
 *   1028 = 4034). Yandex Games has no player count, so it isn't added in.
 * - pipeline: the founder's count, 2026-10-12.
 * - servers and services: the founder's description, 2026-10-12. No
 *   addresses, ports, software versions or what exactly is stored.
 */

export type Lang = "ru" | "en";

/** Date of the cabinet export the player count comes from. */
export const PLAYERS_AS_OF = { ru: "10.10.2026", en: "10 Oct 2026" };

export const GAME_PIPELINE = [
  { key: "concept", count: 3, label: { ru: "концепция", en: "concept" } },
  { key: "dev", count: 3, label: { ru: "в разработке", en: "in development" } },
  { key: "review", count: 2, label: { ru: "на модерации", en: "in review" } },
  { key: "live", count: 4, label: { ru: "опубликованы в ВК", en: "live on VK" } },
] as const;

export const GAMES_TOTAL = GAME_PIPELINE.reduce((sum, s) => sum + s.count, 0);

export const STUDIO_STATS = {
  ru: [
    {
      value: "4 000+",
      label: "игроков добавили игры студии",
      note: `только кабинет ВК, на ${PLAYERS_AS_OF.ru}; Яндекс Игры сверху`,
    },
    {
      value: String(GAMES_TOTAL),
      label: "игр в конвейере",
      note: "4 опубликованы, 2 на модерации, 3 в разработке, 3 в концепции",
    },
    {
      value: "3",
      label: "сервера студии",
      note: "мастерская, данные игроков, шлюз",
    },
  ],
  en: [
    {
      value: "4,000+",
      label: "players have added the studio's games",
      note: `VK developer cabinet alone, as of ${PLAYERS_AS_OF.en}; Yandex Games on top`,
    },
    {
      value: String(GAMES_TOTAL),
      label: "games in the pipeline",
      note: "4 live, 2 in review, 3 in development, 3 at concept stage",
    },
    {
      value: "3",
      label: "studio servers",
      note: "workshop, player data, gateway",
    },
  ],
};

export interface StudioNode {
  key: "gateway" | "workshop" | "data";
  name: string;
  role: string;
  text: string;
}

export const STUDIO_NODES: Record<Lang, StudioNode[]> = {
  ru: [
    {
      key: "gateway",
      name: "Шлюз",
      role: "сервер в Москве",
      text: "Единая точка входа. Раздаёт игры, принимает все входящие подключения и направляет каждое в нужный отдел.",
    },
    {
      key: "workshop",
      name: "Мастерская",
      role: "сервер разработки",
      text: "Здесь идёт работа: агенты пишут код, собирают сборки, гоняют автотесты и выкладывают тестовые версии.",
    },
    {
      key: "data",
      name: "Данные игроков",
      role: "сервер релизов",
      text: "Обработка платежей и хранение данных игроков. Стоит отдельно от мастерской: разработка не трогает то, что принадлежит игрокам.",
    },
  ],
  en: [
    {
      key: "gateway",
      name: "Gateway",
      role: "server in Moscow",
      text: "The single point of entry. Serves the games, accepts every incoming connection and routes each one to the right department.",
    },
    {
      key: "workshop",
      name: "Workshop",
      role: "development server",
      text: "Where the work happens: agents write code, make builds, run automated tests and publish test versions.",
    },
    {
      key: "data",
      name: "Player data",
      role: "release server",
      text: "Processes payments and stores player data. Kept apart from the workshop: development never touches what belongs to players.",
    },
  ],
};

export interface StudioService {
  name: string;
  text: string;
}

export const STUDIO_SERVICES: Record<Lang, StudioService[]> = {
  ru: [
    {
      name: "Платежи в играх",
      text: "Покупки внутри игр за валюту площадки. Каждую покупку подтверждает свой сервер, а не сама игра.",
    },
    {
      name: "Рейтинги",
      text: "Таблицы рекордов игроков на своём сервере.",
    },
    {
      name: "Аналитика",
      text: "Своя система сбора данных: от 100 меток на каждый проект — сайт, игру или бота. Плюс Яндекс Метрика и статистика площадок. Цифры нужны, чтобы улучшать то, чем пользуются люди.",
    },
    {
      name: "Контент",
      text: "Два направления ведутся постоянно, каждое выходит на двух и более площадках.",
    },
  ],
  en: [
    {
      name: "In-game payments",
      text: "Purchases inside the games in the platform's currency. Every purchase is confirmed by our own server, not by the game itself.",
    },
    {
      name: "Leaderboards",
      text: "Player high-score tables on our own server.",
    },
    {
      name: "Analytics",
      text: "Our own data collection: 100+ tracking points per project — a site, a game or a bot. Plus Yandex Metrica and platform statistics. The numbers are there to improve what people actually use.",
    },
    {
      name: "Content",
      text: "Two content lines run continuously, each published on two or more platforms.",
    },
  ],
};

export const STUDIO_COPY = {
  ru: {
    eyebrow: "КАК УСТРОЕНА СТУДИЯ",
    title: "Три сервера, у каждого своя работа",
    line: "Мастерская, где делаются игры, отделена от данных игроков, а снаружи всё встречает один шлюз. Адреса и начинку не публикую: это не секрет фирмы, а обычная гигиена.",
    internet: "игроки и посетители",
    servicesTitle: "Сервисы студии",
    working: "работает",
  },
  en: {
    eyebrow: "HOW THE STUDIO IS BUILT",
    title: "Three servers, each with its own job",
    line: "The workshop where games are made is kept apart from player data, and a single gateway meets everything from outside. Addresses and internals aren't published: not a trade secret, just basic hygiene.",
    internet: "players and visitors",
    servicesTitle: "Studio services",
    working: "running",
  },
};
