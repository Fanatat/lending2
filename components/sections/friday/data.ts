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
    line: "Опубликована в VK. Сто уровней филворда и ни одного звукового файла в сборке: все звуки игра синтезирует сама.",
    microFact: "звуки — синтез, не файлы",
  },
  {
    slug: "nonograms",
    playUrl: "https://catnonogram-vk.vercel.app",
    codeUrl: "https://github.com/Fanatat/catnonogram-vk",
    title: "Кот и японские кроссворды",
    line: "Опубликована в VK. Сто тридцать нонограмм в тематических главах и отдельные ежедневные задания.",
    microFact: "130 уровней и ежедневные задания",
  },
  {
    slug: "color-sort",
    playUrl: "https://color-sort-vk.vercel.app",
    codeUrl: "https://github.com/Fanatat/Color_Sort-Vk",
    title: "Сортировка: Цвет и Форма",
    line: "Опубликована в VK. Элементы различаются цветом и формой, поэтому цвет — не единственный ориентир.",
    microFact: "сортировка по цвету и форме",
  },
  {
    slug: "lane-battler",
    playUrl: "https://fanatat.github.io/games-dev/lane-battle/",
    codeUrl: "https://github.com/Fanatat/lane-battle-vk",
    title: "Две крепости (Lane Battler)",
    line: "Опубликована в VK. Стратегия на одной линии: нанимайте отряд, улучшайте экономику и управляйте героем. Доступна тестовая сборка.",
    microFact: "отряд, экономика и герой",

  },
  {
    slug: "royal-solitaire",
    playUrl: "https://fanatat.github.io/games-dev/royal-solitaire/",
    codeUrl: "https://github.com/Fanatat/Royal_solitaire",
    title: "Королевская Косынка (Royal Solitaire)",
    line: "Опубликована в VK. Косынка с аренами и наградами, сцена на Three.js/WebGL. Доступна тестовая браузерная сборка.",
    microFact: "Three.js · тестовая сборка",
  },
];
