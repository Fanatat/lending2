export interface FridayGame {
  slug: string;
  title: string;
  line: string;
  microFact: string;
  inDevelopment?: boolean;
  /** A build anyone can open in the browser right now. */
  playUrl: string;
  codeUrl: string;
}

export const FRIDAY_GAMES: FridayGame[] = [
  {
    slug: "slovohod",
    playUrl: "https://slovokhod-vk.vercel.app",
    codeUrl: "https://github.com/Fanatat/slovokhod-vk",
    title: "Словоход",
    line: "Сто уровней филворда и ни одного звукового файла в сборке: все звуки игра синтезирует сама.",
    microFact: "звуки — синтез, не файлы",
  },
  {
    slug: "nonograms",
    playUrl: "https://catnonogram-vk.vercel.app",
    codeUrl: "https://github.com/Fanatat/catnonogram-vk",
    title: "Картинки по числам",
    line: "Сто тридцать нонограмм, которые перед каждым релизом проверяют 338 автотестов.",
    microFact: "338 тестов зелёных",
  },
  {
    slug: "color-sort",
    playUrl: "https://color-sort-vk.vercel.app",
    codeUrl: "https://github.com/Fanatat/Color_Sort-Vk",
    title: "Color Sort",
    line: "Сортировка колб, которая проходит дальтоник наравне со всеми: сортируем по цвету и форме сразу.",
    microFact: "дальтоник проходит наравне",
  },
  {
    slug: "lane-battler",
    playUrl: "https://fanatat.github.io/games-dev/lane-battle/",
    codeUrl: "https://github.com/Fanatat/lane-battle-vk",
    title: "Lane Battler",
    line: "Правила боя выведены из 375 негативных отзывов на лидера жанра: починено ровно то, на что жалуются игроки. Не вкусовщина — факты.",
    microFact: "375 отзывов → патч",
    inDevelopment: true,
  },
  {
    slug: "royal-solitaire",
    playUrl: "https://fanatat.github.io/games-dev/royal-solitaire/",
    codeUrl: "https://github.com/Fanatat/Royal_solitaire",
    title: "Royal Solitaire",
    line: "Мультяшная 2.5D косынка на Three.js, прошедшая модерацию Яндекс Игр — не макет, а собранная и выпущенная игра.",
    microFact: "Three.js, прошла модерацию",
  },
];
