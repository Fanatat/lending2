import RevealOnScroll from "@/components/effects/RevealOnScroll";

const STRENGTHS = [
  "Постановка задач ИИ-агентам и приёмка результата фактами, не «на слово» — prompt engineering и оркестрация агентов в боевом режиме, не учебном.",
  "Параллельное ведение нескольких исполнителей: до пяти команд одновременно, разбор конфликтов, выбор методологии по результату.",
  "Эксплуатация: Linux, systemd, cron, логи и их ротация, бэкапы, мониторинг с внешним сторожем.",
  "Браузерная автоматизация: Playwright, AdsPower + MCP, работа без официальных API.",
  "Площадки: VK Bridge, Yandex Games SDK, реклама/покупки/сохранения, прохождение модерации.",
  "Честность как рабочий инструмент: не обещаю того, чего не проверил; в отчётах оставляю неудобные факты.",
];

/**
 * Recruiter-facing "who is behind this" block — the page otherwise shows
 * systems, not a candidate. Sits right after Hero, before the systems start.
 * Copy is the founder's own (see career/резюме_v2_2026-09-20.md, "Коротко" +
 * "Чем силён"), lightly paraphrased to avoid asserting a game count the
 * founder hasn't reconciled yet (site vs. résumé disagree — see FridaySection).
 */
export default function OperatorSection() {
  return (
    <section
      id="operator"
      className="border-t border-line px-4 py-14 sm:px-6 sm:py-20 md:px-10 lg:px-16"
    >
      <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2 lg:gap-16">
        <div>
          <RevealOnScroll index={0}>
            <div className="text-xs tracking-widest text-fg-muted">
              КТО ЗА ПУЛЬТОМ
            </div>
          </RevealOnScroll>
          <RevealOnScroll index={1}>
            <h2 className="mt-2 text-2xl text-fg-primary sm:text-3xl">
              Валерий
            </h2>
          </RevealOnScroll>
          <RevealOnScroll index={2}>
            <p className="mt-2 max-w-xl text-sm text-accent sm:text-base">
              Продюсер систем на ИИ-агентах — ставлю задачу, принимаю
              фактом, довожу до продакшна; код пишут агенты.
            </p>
          </RevealOnScroll>
          <RevealOnScroll index={3}>
            <p className="mt-1 text-xs text-fg-muted">
              Нижний Новгород / Ереван / Москва — удалённо, включая
              иностранные компании
            </p>
          </RevealOnScroll>

          <RevealOnScroll index={4}>
            <p className="mt-6 text-left text-sm leading-relaxed text-fg-primary/90 sm:text-justify sm:text-base">
              Делаю работающие системы под задачу и довожу их до
              эксплуатации: ставлю задачу ИИ-агентам (Claude Code), принимаю
              результат фактами (живой запуск, тесты, метрики), запускаю в
              продакшн и обслуживаю. Код руками не пишу — это осознанная
              позиция, а не пробел: моя работа — постановка, приёмка,
              эксплуатация и разбор конфликтов между исполнителями. За
              май–сентябрь 2026 таким способом собраны и запущены системы с
              этой страницы: игры для VK и Яндекс Игр, боты и мониторинг в
              продакшне, инфраструктура, которая обходится в 2 000 ₽ в
              месяц. Все проекты — независимые, собственные; ищу место, где
              эта же способность приносит пользу чужому продукту.
            </p>
          </RevealOnScroll>

          <RevealOnScroll
            index={5}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <a
              href="https://github.com/Fanatat"
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="interactive"
              className="inline-block border border-accent px-6 py-3 text-sm text-accent transition-[filter] duration-200 hover:[filter:drop-shadow(0_0_6px_var(--accent))]"
            >
              GitHub
            </a>
            <a
              href="#closing"
              data-cursor="interactive"
              className="inline-block border border-line px-6 py-3 text-sm text-fg-primary transition-colors duration-200 hover:border-accent hover:text-accent"
            >
              Написать
            </a>
          </RevealOnScroll>
        </div>

        <RevealOnScroll index={3} className="flex items-start">
          <ul className="w-full space-y-3 border border-line bg-panel p-5">
            {STRENGTHS.map((line) => (
              <li
                key={line}
                className="border-b border-line/50 pb-3 text-sm leading-relaxed text-fg-primary/90 last:border-b-0 last:pb-0"
              >
                {line}
              </li>
            ))}
          </ul>
        </RevealOnScroll>
      </div>
    </section>
  );
}
