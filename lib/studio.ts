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
 * - pipeline: the founder's count, 2026-10-13 (résumé v3): 9 games built —
 *   4 live, 4 in review, 1 in development (the Steam one) — plus 3 concepts.
 * - servers and services: the founder's description, 2026-10-12. No
 *   addresses, ports, software versions or what exactly is stored.
 * The hero shows the bare figures: the founder asked to drop the long
 * explanations under the first two (2026-10-12), the sources stay here.
 */

export type Lang = "ru" | "en";

/** Date of the cabinet export the player count comes from. */
export const PLAYERS_AS_OF = { ru: "10.10.2026", en: "10 Oct 2026" };

export const GAME_PIPELINE = [
  { key: "concept", count: 3, label: { ru: "концепция", en: "concept" } },
  { key: "dev", count: 1, label: { ru: "в разработке", en: "in development" } },
  { key: "review", count: 4, label: { ru: "на модерации", en: "in review" } },
  { key: "live", count: 4, label: { ru: "опубликованы в ВК", en: "live on VK" } },
] as const;

export const GAMES_TOTAL = GAME_PIPELINE.reduce((sum, s) => sum + s.count, 0);

export interface StudioStat {
  value: string;
  label: string;
  note?: string;
}

export const STUDIO_STATS: Record<Lang, StudioStat[]> = {
  ru: [
    {
      value: "4 000+",
      label: "пользователей",
    },
    {
      value: String(GAMES_TOTAL),
      label: "игр",
    },
    {
      value: "4",
      label: "сервера",
      note: "мастерская, обработка платежей + хостинг, шлюз, прокси-сервер",
    },
  ],
  en: [
    {
      value: "4,000+",
      label: "users",
    },
    {
      value: String(GAMES_TOTAL),
      label: "games",
    },
    {
      value: "4",
      label: "servers",
      note: "workshop, payment processing + hosting, gateway, proxy server",
    },
  ],
};

export interface StudioNode {
  key: "gateway" | "workshop" | "data" | "proxy";
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
      text: "Единая точка входа. Принимает все входящие подключения и направляет каждое в нужный отдел.",
    },
    {
      key: "workshop",
      name: "Мастерская",
      role: "сервер разработки",
      text: "Здесь идёт работа: агенты пишут код, собирают сборки, гоняют автотесты и выкладывают тестовые версии.",
    },
    {
      key: "data",
      name: "Платежи и хостинг",
      role: "сервер релизов",
      text: "Обработка платежей, хранение данных игроков и хостинг игр. Стоит отдельно от мастерской: разработка не трогает то, что принадлежит игрокам.",
    },
    {
      key: "proxy",
      name: "Прокси-сервер",
      role: "сетевой маршрут",
      text: "Резервный маршрут: при сбое в дата-центре трафик студии автоматически переключается на него.",
    },
  ],
  en: [
    {
      key: "gateway",
      name: "Gateway",
      role: "server in Moscow",
      text: "The single point of entry. Accepts every incoming connection and routes each one to the right department.",
    },
    {
      key: "workshop",
      name: "Workshop",
      role: "development server",
      text: "Where the work happens: agents write code, make builds, run automated tests and publish test versions.",
    },
    {
      key: "data",
      name: "Payments and hosting",
      role: "release server",
      text: "Payment processing, player data storage and game hosting. Kept apart from the workshop: development never touches what belongs to players.",
    },
    {
      key: "proxy",
      name: "Proxy server",
      role: "network route",
      text: "The backup route: if a data centre fails, the studio's traffic switches over to it automatically.",
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
      name: "Обработка платежей",
      text: "Внутриигровые покупки: они обрабатываются и хранятся на собственном сервере.",
    },
    {
      name: "Рейтинги",
      text: "Таблицы рекордов игроков на своём сервере.",
    },
    {
      name: "Аналитика",
      text: "Независимая система сбора данных: более 100 меток на проект. И это помимо собственной аналитики площадок — VK, Яндекса и других.",
    },
    {
      name: "Документы",
      text: "Пользовательское соглашение и политику конфиденциальности для каждой игры составляю сам.",
    },
    {
      name: "Контент",
      text: "Два канала на основе фото и текста. И ещё два направления по видео — каждое публикуется автоматически на двух и более площадках.",
    },
  ],
  en: [
    {
      name: "Payment processing",
      text: "In-game purchases: they are processed and stored on our own server.",
    },
    {
      name: "Leaderboards",
      text: "Player high-score tables on our own server.",
    },
    {
      name: "Analytics",
      text: "An independent data collection system: 100+ tracking points per project. And that's on top of each platform's own analytics — VK, Yandex and others.",
    },
    {
      name: "Legal documents",
      text: "The terms of use and the privacy policy for every game are drawn up in-house.",
    },
    {
      name: "Content",
      text: "Two channels built on photos and text. Plus two video lines — each published automatically on two or more platforms.",
    },
  ],
};

export const STUDIO_COPY = {
  ru: {
    eyebrow: "КАК УСТРОЕНА СТУДИЯ",
    title: "Четыре сервера, у каждого своя работа",
    line: "Мастерская, где делаются игры, отделена от данных игроков, а снаружи всё встречает один шлюз. Адреса и начинку не публикую: это не секрет фирмы, а обычная гигиена.",
    internet: "игроки и посетители",
    servicesTitle: "Сервисы студии",
    working: "работает",
  },
  en: {
    eyebrow: "HOW THE STUDIO IS BUILT",
    title: "Four servers, each with its own job",
    line: "The workshop where games are made is kept apart from player data, and a single gateway meets everything from outside. Addresses and internals aren't published: not a trade secret, just basic hygiene.",
    internet: "players and visitors",
    servicesTitle: "Studio services",
    working: "running",
  },
};
