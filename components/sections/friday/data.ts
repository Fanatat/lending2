export interface FridayGame {
  slug: string;
  title: string;
  line: string;
  microFact: string;
  inDevelopment?: boolean;
  /** The published game on its platform. */
  playUrl: string;
  codeUrl: string;
}

/**
 * Only games players can open today. Games still in review or in
 * development are counted in GamePipeline (lib/studio.ts) without titles.
 */
export const FRIDAY_GAMES: FridayGame[] = [
  {
    slug: "slovohod",
    playUrl: "https://vk.com/app54674073",
    codeUrl: "https://github.com/Fanatat/slovokhod-vk",
    title: "Словоход",
    line: "Опубликована в VK. Сто уровней филворда и ни одного звукового файла в сборке: все звуки игра синтезирует сама.",
    microFact: "звуки — синтез, не файлы",
  },
  {
    slug: "nonograms",
    playUrl: "https://vk.com/app54676906",
    codeUrl: "https://github.com/Fanatat/catnonogram-vk",
    title: "Кот и японские кроссворды",
    line: "Опубликована в VK. Сто тридцать нонограмм в тематических главах и отдельные ежедневные задания.",
    microFact: "130 уровней и ежедневные задания",
  },
  {
    slug: "color-sort",
    playUrl: "https://vk.com/app54683949",
    codeUrl: "https://github.com/Fanatat/Color_Sort-Vk",
    title: "Сортировка: Цвет и Форма",
    line: "Опубликована в VK. Элементы различаются цветом и формой, поэтому цвет — не единственный ориентир.",
    microFact: "сортировка по цвету и форме",
  },
  {
    slug: "lane-battler",
    playUrl: "https://vk.com/app54759696",
    codeUrl: "https://github.com/Fanatat/lane-battle-vk",
    title: "Две крепости",
    line: "Опубликована в VK. Стратегия на одной линии: нанимайте отряд, улучшайте экономику и управляйте героем.",
    microFact: "отряд, экономика и герой",
  },
];
