import type { Metadata } from "next";
import SetHtmlLang from "@/components/effects/SetHtmlLang";
import SiteFooter from "@/components/sections/closing/SiteFooter";

const TITLE = "Hi, I'm Valery";
const DESCRIPTION =
  "Eight autonomous systems. Zero employees, one AI subscription, zero promises.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/en",
    languages: {
      ru: "/",
      en: "/en",
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/en",
    siteName: TITLE,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const SYSTEMS = [
  {
    number: "01",
    title: "Friday Studio",
    line: "Five browser games shipped to VK Mini Apps and Yandex Games — full release cycle: platform SDKs, ads, in-app purchases, cloud saves, leaderboards, moderation.",
  },
  {
    number: "02",
    title: "HP100",
    line: "ESP32 air-quality monitor, seven sensors, offline buffering, public live feed. Running continuously for 90+ days.",
  },
  {
    number: "03",
    title: "Channel autopilot",
    line: "Two Telegram channels publishing unattended as system services. One has run 500+ days without a single failure.",
  },
  {
    number: "04",
    title: "Bridge",
    line: "SOCKS5/HTTP proxy bridge for Telegram Desktop, running as a production system service.",
  },
  {
    number: "05",
    title: "All in",
    line: "Read-only crypto portfolio analytics: Python computes the numbers on a schedule, an LLM only writes the report from them. No trading signals.",
  },
  {
    number: "06",
    title: "Content factory",
    line: "Three-language (EN/ES/RU) animation pipeline — 12 videos run through the full pipeline end to end.",
  },
  {
    number: "07",
    title: "Staff",
    line: "An eight-agent Telegram operations HQ, plus monitoring with a dead man's switch. 111+ days in production.",
  },
  {
    number: "08",
    title: "Perimeter",
    line: "Home-network security audit; the perimeter is now re-checked automatically every 20 minutes.",
  },
];

/**
 * Minimal English entry point for recruiters coming from LinkedIn / foreign
 * companies (see career/docs/ТЗ_lending2_2026-09-20.md, item 3). Deliberately
 * lighter than the Russian page: translates the Hero, the Operator block and
 * short one-line captions per system, not the full interactive experience —
 * the RU page (linked via the RU/EN switch) stays the canonical showcase.
 */
export default function EnglishHomePage() {
  return (
    <main>
      <SetHtmlLang lang="en" />

      <section className="flex min-h-[70svh] flex-col justify-center gap-6 px-4 py-20 sm:px-6 sm:py-24 md:px-10 lg:px-16">
        <div className="text-xs tracking-widest text-fg-muted">
          #NOT_A_RESUME — A LIST OF SHIPPED TASKS
        </div>
        <h1 className="max-w-2xl text-3xl text-fg-primary sm:text-4xl">
          {TITLE}
        </h1>
        <p className="max-w-2xl text-base text-fg-primary/90 sm:text-lg">
          {DESCRIPTION} They keep working while you&apos;re reading this
          line.
        </p>
      </section>

      <section className="border-t border-line px-4 py-14 sm:px-6 sm:py-20 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="text-xs tracking-widest text-fg-muted">
              WHO&apos;S AT THE CONSOLE
            </div>
            <h2 className="mt-2 text-2xl text-fg-primary sm:text-3xl">
              Valery
            </h2>
            <p className="mt-2 max-w-xl text-sm text-accent sm:text-base">
              Producer / technical lead who ships working systems by
              directing AI coding agents.
            </p>
            <p className="mt-1 text-xs text-fg-muted">
              Nizhny Novgorod / Yerevan / Moscow — remote, including
              international companies. Open to relocation.
            </p>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-fg-primary/90 sm:text-base">
              I don&apos;t write code myself: I specify the task for AI
              coding agents (Claude Code), verify the result by fact — a
              live run, tests, metrics — deploy it and keep it running.
              May–September 2026: five browser games shipped to VK Mini Apps
              and Yandex Games (one localized into 11 languages), two
              Telegram bots in production for 500+ days, an ESP32
              air-quality monitor with a public live feed, an eight-agent
              operations HQ with dead-man&apos;s-switch monitoring, a
              read-only crypto portfolio analytics pipeline, and a
              three-language animation pipeline — all on a 2,000 RUB/month
              (≈20 USD) infrastructure. Honest about the boundary: I
              orchestrate agents and own the outcome; I am not a classic
              developer.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
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
                href="https://max.ru/se14158141_bot"
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="interactive"
                className="inline-block border border-line px-6 py-3 text-sm text-fg-primary transition-colors duration-200 hover:border-accent hover:text-accent"
              >
                Write
              </a>
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-full border border-line bg-panel p-5 text-sm leading-relaxed text-fg-primary/90">
              I take on tasks I&apos;m genuinely curious to solve — that&apos;s
              where the craft is. If you have a problem like that and can
              show why it matters, get in touch. I&apos;ll take a look, and
              if it&apos;s worth solving, I&apos;ll take your problem and
              hand you back a working mechanism.
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line px-4 py-14 sm:px-6 sm:py-20 md:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-xs tracking-widest text-fg-muted">
            THE SYSTEMS
          </div>
          <p className="mt-2 max-w-2xl text-sm text-fg-muted">
            Full interactive versions of each system — live widgets, not
            just text — are on the{" "}
            <a href="/" className="text-accent hover:underline">
              Russian page
            </a>
            .
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {SYSTEMS.map((s) => (
              <div key={s.number} className="border border-line bg-panel p-5">
                <div className="text-[10px] tracking-widest text-fg-muted">
                  SYSTEM {s.number}
                </div>
                <div className="mt-1 text-base text-fg-primary">
                  {s.title}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-fg-primary/80">
                  {s.line}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
