export interface ProjectMeta {
  slug: string;
  title: string;
  todo: string;
}

/**
 * The 8 project detail pages called for in ТЗ раздел 6. Their real content
 * (demo footage, logs, report fragments, prompt architecture, etc.) has not
 * been supplied by the author yet — each page ships a structural stub with
 * a visible TODO badge instead of inventing facts. Staff is the exception:
 * a working chat simulator, since that's fully specified and buildable now.
 */
export const PROJECTS: ProjectMeta[] = [
  {
    slug: "friday-studio",
    title: "Студия «Пятница»",
    todo: "Живое демо / видео геймплея каждой из четырёх игр.",
  },
  {
    slug: "hp100",
    title: "HP100",
    todo: "Архитектурная схема платы и живой лог показаний сервера.",
  },
  {
    slug: "channel-autopilot",
    title: "Автопилот канала",
    todo: "Лог работы обоих ботов и архитектура публикации.",
  },
  {
    slug: "bridge",
    title: "Мост",
    todo: "Лог соединений моста и схема авторизации/туннелирования.",
  },
  {
    slug: "all-in",
    title: "All in",
    todo: "Детерминированный график цены и разбор формул Python-модуля.",
  },
  {
    slug: "content-factory",
    title: "Контент-завод",
    todo: "Примеры сгенерированных материалов и архитектура промптов.",
  },
  {
    slug: "staff",
    title: "Штаб",
    todo: "Реальные характеры, имена и связи агентов (см. ТЗ раздел 12, п.4).",
  },
  {
    slug: "perimeter",
    title: "Периметр",
    todo: "Фрагмент реального отчёта об аудите сети.",
  },
];

export function getProjectMeta(slug: string): ProjectMeta | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}
