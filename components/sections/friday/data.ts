export interface FridayGame {
  slug: string;
  title: string;
  line: string;
  microFact: string;
  inDevelopment?: boolean;
}

export const FRIDAY_GAMES: FridayGame[] = [
  {
    slug: "slovohod",
    title: "Словоход",
    line: "Сто уровней филворда и ни одного звукового файла в сборке: все звуки игра синтезирует сама.",
    microFact: "звуки — синтез, не файлы",
  },
  {
    slug: "nonograms",
    title: "Картинки по числам",
    line: "Сто тридцать нонограмм, которые перед каждым релизом проверяют 338 автотестов.",
    microFact: "338 тестов зелёных",
  },
  {
    slug: "color-sort",
    title: "Color Sort",
    line: "Сортировка колб, которая проходит дальтоник наравне со всеми: сортируем по цвету и форме сразу.",
    microFact: "дальтоник проходит наравне",
  },
  {
    slug: "lane-battler",
    title: "Lane Battler",
    line: "Правила боя выведены из 375 негативных отзывов на игру-лидера жанра. Мы починили ровно то, на что жалуются игроки. Вкус не имеет значения, имеют значение только факты.",
    microFact: "375 отзывов → патч",
    inDevelopment: true,
  },
];
