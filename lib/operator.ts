/**
 * "Who is at the console": the founder as a candidate, shared by the RU
 * page and the EN one. Source: career/выгрузка/резюме_v3_2026-10-12.md and
 * lending2_тексты_v3_2026-10-12.md (founder, 2026-10-13). Hours are the
 * founder's own estimate; the Linda figures come from its database.
 * No phone or e-mail here: contact goes through Telegram.
 */
import type { Lang } from "@/lib/studio";

export interface OperatorCopy {
  eyebrow: string;
  name: string;
  role: string;
  lead: string;
  where: string;
  stats: { value: string; label: string }[];
  tasksTitle: string;
  tasks: string[];
  howTitle: string;
  how: string[];
  caseTitle: string;
  caseText: string;
  caseBusiness: string;
  honest: string;
}

export const OPERATOR_COPY: Record<Lang, OperatorCopy> = {
  ru: {
    eyebrow: "КТО ЗА ПУЛЬТОМ",
    name: "Валерий",
    role: "AI-специалист: превращаю рутину в ИИ-автоматизацию, которая работает без присмотра",
    lead: "Внедряю ИИ-агентов (Claude Code) в процессы — от задачи до работающей системы с тестами, мониторингом и контролем человека.",
    where: "Нижний Новгород / Ереван / Москва · удалённо",
    stats: [
      { value: "~2 000", label: "часов практики с ИИ-агентами" },
      { value: "20+", label: "систем в работе" },
      { value: "500+", label: "дней без падений у бота" },
    ],
    tasksTitle: "С чем приходить",
    tasks: [
      "Отчёты и данные из разных систем собираются вручную.",
      "Поток заявок, лидов, резюме или документов нужно разбирать и отсеивать.",
      "Нужен бот или ИИ-ассистент для сотрудников или клиентов.",
      "Команда хочет работать с ИИ-агентами, но не знает, как организовать процесс.",
    ],
    howTitle: "Как работаю",
    how: [
      "Разбираю процесс и нахожу, где автоматизация даст эффект.",
      "Ставлю задачу ИИ-агентам и принимаю результат только проверкой: тесты, живой запуск.",
      "Запускаю и сопровождаю: логи, бэкапы, мониторинг, тревоги. Числа считает код, ИИ только формулирует.",
    ],
    caseTitle: "Линда — ИИ-отбор вакансий, который сам себя чинит",
    caseText: "Каждые 15 минут собирает вакансии с hh.ru и Хабр Карьеры, одна модель отсеивает чужое, вторая оценивает по профилю: из 7 300+ вакансий до человека дошло меньше 3 %. Отклик — только после его решения. Когда площадка меняет разметку, сторож замечает поломку, а ИИ чинит парсер в песочнице; правка принимается, только если прошли все 134 теста.",
    caseBusiness: "Для бизнеса это мониторинг и квалификация лидов, заявок или тендеров с контролем человека.",
    honest: "Код руками не пишу: управляю ИИ-агентами и отвечаю за результат. Вместо стажа в найме — работающие системы, их можно открыть и проверить ниже.",
  },
  en: {
    eyebrow: "WHO'S AT THE CONSOLE",
    name: "Valery",
    role: "AI specialist: I turn routine work into AI automation that runs unattended",
    lead: "I bring AI agents (Claude Code) into business processes — from the task to a working system with tests, monitoring and human control.",
    where: "Nizhny Novgorod / Yerevan / Moscow · remote",
    stats: [
      { value: "~2,000", label: "hours of hands-on work with AI agents" },
      { value: "20+", label: "systems in operation" },
      { value: "500+", label: "days without a crash for one bot" },
    ],
    tasksTitle: "Bring me",
    tasks: [
      "Reports and data from several systems are put together by hand.",
      "A stream of requests, leads, CVs or documents needs sorting and filtering.",
      "You need a bot or an AI assistant for staff or customers.",
      "Your team wants to work with AI agents but doesn't know how to organise it.",
    ],
    howTitle: "How I work",
    how: [
      "I take the process apart and find where automation pays off.",
      "I give the task to AI agents and accept the result only by checks: tests, a live run.",
      "I launch it and keep it running: logs, backups, monitoring, alerts. Code does the maths, AI only words it.",
    ],
    caseTitle: "Linda — AI job screening that repairs itself",
    caseText: "Every 15 minutes it collects vacancies from hh.ru and Habr Career; one model drops what's clearly off, a second scores the rest against the profile: of 7,300+ vacancies, under 3% reached a human. Applying happens only after their decision. When a site changes its markup, a watchdog spots the breakage and AI fixes the parser in a sandbox; the fix is accepted only if all 134 tests pass.",
    caseBusiness: "For a business, that's monitoring and qualifying leads, requests or tenders with a human in control.",
    honest: "I don't write code by hand: I run AI agents and answer for the result. Instead of years on payroll — working systems you can open and check below.",
  },
};
