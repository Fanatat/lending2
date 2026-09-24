import type { Metadata } from "next";
import type { ReactNode } from "react";
import SetHtmlLang from "@/components/effects/SetHtmlLang";
import DetailsDisclosure from "@/components/sections/DetailsDisclosure";
import SiteFooter from "@/components/sections/closing/SiteFooter";
import { GITHUB_URL, MAX_URL, OG_IMAGE, TELEGRAM_URL, asset } from "@/lib/site";

const TITLE = "Hi, I'm Valery";
const DESCRIPTION =
  "Eight autonomous systems. Zero employees, one AI subscription, zero promises.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: asset("/en"),
    languages: {
      ru: asset("/"),
      en: asset("/en"),
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: asset("/en"),
    siteName: TITLE,
    locale: "en_US",
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

const struck = (word: string) => (
  <span className="text-fg-muted/50 line-through">{word}</span>
);

interface System {
  number: string;
  title: string;
  footnote?: string;
  line: ReactNode;
  details: ReactNode;
  games?: { title: string; line: string; inDevelopment?: boolean }[];
}

/**
 * The same eight systems, in the same order and with the same copy as the
 * Russian page (SYSTEM_COPY + each section's own line) — translated, not
 * rewritten, so the two versions tell one story.
 */
const SYSTEMS: System[] = [
  {
    number: "SYSTEM 01",
    title: "Five games by the “Friday” studio, plus promo materials",
    line: "The full cycle — from clean, fast code to promo videos. While a competitor is still loading megabytes of framework, our game has already taken the player's first move.",
    details:
      "A separate system first develops a game, then puts it in the maintenance queue. It prepares promo materials and store-page copy for the platforms. Scripts launch the game in a headless browser on their own, record gameplay in vertical and horizontal formats, check that no Cyrillic has leaked into the English build, and cut the video.",
    games: [
      { title: "Slovokhod", line: "A hundred word-search levels and not a single audio file in the build: the game synthesises every sound itself." },
      { title: "Pictures by Numbers", line: "130 nonograms, checked by 338 automated tests before every release." },
      { title: "Color Sort", line: "Flask sorting that a colour-blind player beats on equal terms: you sort by colour and shape at once." },
      { title: "Lane Battler", line: "The combat rules come from 375 negative reviews of the genre leader: we fixed exactly what players complain about. Not taste — facts.", inDevelopment: true },
      { title: "Royal Solitaire", line: "A cartoon 2.5D Klondike on Three.js that passed Yandex Games moderation — not a mock-up, a built and released game." },
    ],
  },
  {
    number: "SYSTEM 02",
    title: "While you're in the flow and losing track of time, the board keeps an eye on what you breathe",
    line: "CO₂ and dust are invisible, but they drain your HP. Your nose can't sense them — the board can. (Actually, the board doesn't care. We taught it to worry.)",
    details:
      "A board with seven sensors sends temperature, humidity, pressure, light level, volatile compounds, three fractions of dust and CO₂ to the server once a minute. When the server is unreachable, the board notices by itself, buffers readings in its own memory and sends them with their real timestamps as soon as the connection is back. One of the sensors turned out to be a clone with its own protocol: we decoded it by hand, standard libraries can't see it. The setup moves to a greenhouse, a server room or any workplace without a single change to the logic.",
  },
  {
    number: "SYSTEM 03",
    title: "Channels that publish and live without me",
    line: "I filled a folder with 169,000+ photos once — from then on the channel runs itself: it posts during the day at unpredictable times, so the feed doesn't look robotic.",
    details:
      "Two bots. The first posts a set of nine photos with a caption once a day and moves what it used into an archive, so nothing repeats. The second wakes up on schedule: text at 5:50, video at 6:30; it collects material in advance from source channels by itself and hands it out one piece a day. Both have an admin panel right in the chat: status, manual run, subscriber analytics, automatic database backup. The first has run as a system service for months without a crash. The second was started by hand and still hasn't missed a single post.",
  },
  {
    number: "SYSTEM 04",
    title: "A fix for the RuNet that's coming.",
    line: (
      <>
        The bridge connects SOCKS5 to HTTP and brings {struck("Telegram")}{" "}
        Desktop back to working order in a couple of minutes.
      </>
    ),
    details:
      "A local server starts on the computer and takes over all the dirty work: authorisation, tunnelling, handling connections, with a log of every one of them. The instructions are built like proper diagnostics, from cheap to expensive: first two checkboxes in the app's own settings, and only if that didn't help does the bridge start. It runs as a system service, self-test green. The task is a standard one: the same cure works for any application that speaks one protocol while you have another one paid for and available.",
  },
  {
    number: "SYSTEM 05",
    title: "All in",
    footnote: "what?",
    line: "Crypto portfolio analytics that sees where the market punishes the greedy: the market situation, your assets, a comparison of instruments and the maths of risk. What it can't do is press “Buy” — it's built that way.",
    details:
      "The system reads a portfolio on the exchange and explains in plain language what is happening to it: the exact picture of the money, concentration, drawdown, liquidity, a calendar of token unlocks. It sees when the market situation has changed and there is potential to earn more by moving into another asset or changing the way it yields. It gives no trading signals and doesn't predict prices — by a deliberate decision. All numbers are calculated by Python using carefully verified formulas in a separate module — the module runs on my server and updates the calculations on a schedule; the language model receives ready-made figures and writes the sentences, so no invented numbers appear in the report. The portfolio on the Russian page is a masked snapshot of the same data structure: real amounts and holdings aren't published for privacy reasons, not because the connection isn't ready. The framework carries over to any operational monitoring where the conclusions are worded by AI.",
  },
  {
    number: "SYSTEM 06",
    title: "One idea can turn into a whole season of cartoons in three languages",
    line: "One production line serves three channels: the script, the voice-over and all the material for editing are assembled and numbered — the editor only has to create.",
    details:
      "The system gets a topic and carries on by itself: writes the story, splits it into scenes, sets up characters and settings, lays it out shot by shot, assembles image descriptions, generates images, records the voice-over, edits and exports almost-finished material — all that's left is to put the video together in Premiere. The story is written once in canonical form; the English, Spanish and Russian versions are derived from it. Twelve real videos have already been assembled from start to finish. All generation runs on an ordinary home computer, with no subscriptions or APIs — including the review stage, where an LLM itself checks that the script follows the plan, the characters in the pictures don't change, and the overall setting holds. This way several cartoon series can run in parallel.",
  },
  {
    number: "SYSTEM 07",
    title: "An operations HQ of eight autonomous agents",
    line: "Every project needs focus. To keep it from blurring as I switch between tasks, I set up a department that has effectively become my deputies.",
    details: (
      <>
        A shared chat where eight different characters live: each has a name,
        a manner of speaking and its own memory area. No noise, only
        pragmatic calculation. Sometimes they joke around — I couldn&apos;t do
        without that option. No project here is frozen: all eight keep
        developing, and the agents are responsible precisely for that
        development. Today the HQ lives in {struck("Telegram")}; soon it will
        run in MAX in parallel.
      </>
    ),
  },
  {
    number: "SYSTEM 08",
    title: "AI makes mistakes even in the right hands. It needs an oversight body.",
    line: "An autonomous system checks the network for data leaks and unauthorised intrusion. It is forbidden to act on its own — only with the founder's permission.",
    details:
      "A full check of the local network for internal and external threats: from the outside, a public IP leads straight to the router, and behind it stand four equal devices — a server, a PC, a nettop and a laptop. For months the server's network share exposed the entire home directory for reading, and it held an exchange key and bot tokens. One computer served its user profile anonymously, without a password. The report separately records a case where drafts of the audit itself once saved some of the secrets in plain text to that same shared folder: the inconvenient fact stayed in the document. The most useful thing in the work turned out to be the order of actions. First close the doors, then rotate the secrets — and do it from a device known to be clean.",
  },
];

const COST_LINES = [
  { label: "Rented server", amount: 300 },
  { label: "Third-party proxy", amount: 200 },
  { label: "AI subscription", amount: 1500 },
];
const TOTAL = COST_LINES.reduce((sum, l) => sum + l.amount, 0);
const TOTAL_LABEL = TOTAL.toLocaleString("en-US");

const buttonClass =
  "inline-block border border-accent px-6 py-3 text-sm text-accent transition-[filter] duration-200 hover:[filter:drop-shadow(0_0_6px_var(--accent))]";

/**
 * English entry point for recruiters coming from LinkedIn / foreign
 * companies. Same content as the Russian page, block for block — only the
 * interactive widgets (and the easter eggs hidden in them) stay on the RU
 * page, which is linked from the systems list.
 */
export default function EnglishHomePage() {
  return (
    <main>
      <SetHtmlLang lang="en" />

      <section id="hero" className="flex min-h-[100svh] flex-col justify-center gap-6 px-4 py-20 sm:px-6 sm:py-24 md:px-10 lg:px-16">
        <h1 className="max-w-3xl text-3xl text-fg-primary sm:text-4xl">
          #NOTARESUME — a list of shipped tasks
        </h1>
        <p className="max-w-2xl text-base text-fg-primary sm:text-lg">
          Eight autonomous systems. Zero employees, one AI subscription, zero
          promises. While you&apos;re reading this line, they keep working.
        </p>
        <p className="max-w-xl text-xs text-fg-muted">
          All of this costs 2,000 ₽ a month. The proof is below.
        </p>
      </section>

      <section id="operator" className="border-t border-line px-4 py-14 sm:px-6 sm:py-20 md:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-xs tracking-widest text-fg-muted">
            WHO&apos;S AT THE CONSOLE
          </div>
          <h2 className="mt-2 text-2xl text-fg-primary sm:text-3xl">Valery</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-fg-primary/90 sm:text-base">
            Producer of AI-agent systems: I set the task, accept the result by
            facts and take it to production. The code is written by agents —
            it&apos;s on{" "}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="interactive"
              className="text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </section>

      {SYSTEMS.map((s) => (
        <section
          key={s.number}
          id={s.number.toLowerCase().replace(" ", "-")}
          className="border-t border-line px-4 py-14 sm:px-6 sm:py-20 md:px-10 lg:px-16"
        >
          <div className="grid min-w-0 items-start gap-8 lg:grid-cols-2 lg:gap-16">
            <div className="min-w-0">
              <div className="text-xs tracking-widest text-fg-muted">
                {s.number}
              </div>
              <h2 className="mt-2 max-w-xl text-2xl text-fg-primary sm:text-3xl">
                {s.title}
              </h2>
              {s.footnote && (
                <p className="mt-1 text-[9px] text-fg-muted/60">{s.footnote}</p>
              )}
              <p className="mt-4 max-w-xl text-sm text-fg-primary/90 sm:text-base">
                {s.line}
              </p>
              {s.games && <DetailsDisclosure text={s.details} label="More" />}
            </div>
            {/* The RU page has a live widget in this column; here the
                system's "more" text takes its place (System 01 lists its
                games instead and keeps the text behind a disclosure). */}
            {!s.games && (
              <div className="min-w-0 border border-line bg-panel p-5 text-sm leading-relaxed text-fg-muted">
                {s.details}
              </div>
            )}
            {s.games && (
              <ul className="grid min-w-0 gap-3 sm:grid-cols-2">
                {s.games.map((g) => (
                  <li key={g.title} className="border border-line bg-panel p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm text-fg-primary">{g.title}</span>
                      {g.inDevelopment && (
                        <span className="shrink-0 text-[10px] text-fg-muted">
                          in development
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-fg-primary/75">
                      {g.line}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}

      <section className="border-t border-line px-4 py-10 sm:px-6 md:px-10 lg:px-16">
        <p className="mx-auto max-w-4xl text-sm text-fg-muted">
          Every system above has a live, interactive version — widgets, not
          just text — on the{" "}
          <a href={asset("/")} className="text-accent hover:underline">
            Russian page
          </a>
          .
        </p>
      </section>

      <section id="closing" className="border-t border-line px-4 py-16 sm:px-6 sm:py-24 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 flex items-start justify-center lg:order-1 lg:justify-start">
            <div className="w-full max-w-sm border border-line bg-panel p-5">
              <div className="text-[10px] uppercase tracking-wide text-fg-muted">
                Infrastructure upkeep
              </div>
              <table className="mt-3 w-full text-sm">
                <tbody>
                  {COST_LINES.map((line) => (
                    <tr key={line.label} className="border-b border-line/50">
                      <td className="py-2 text-fg-muted">{line.label}</td>
                      <td className="py-2 text-right tabular-nums text-fg-primary">
                        {line.amount} ₽
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="pt-3 text-fg-primary">Total per month</td>
                    <td className="pt-3 text-right text-xl font-bold tabular-nums text-accent">
                      {TOTAL_LABEL} ₽
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="text-2xl text-fg-primary sm:text-3xl">
              Infrastructure upkeep: {TOTAL_LABEL} roubles a month
            </h2>
            <p className="mt-6 text-sm leading-relaxed text-fg-primary/90 sm:text-base">
              The line-by-line breakdown is in the block next to this. Nothing
              else was needed.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-fg-primary/90 sm:text-base">
              I build systems, and sometimes I can get too deep into them. So
              that I don&apos;t end up at the clinic later, HP100 keeps an eye
              on my room. And keeping all of this running takes {TOTAL_LABEL}{" "}
              roubles a month.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-fg-primary/90 sm:text-base">
              I don&apos;t take orders. I take on tasks I&apos;m genuinely
              curious to solve — that&apos;s what keeps the work creative. If
              you have a task like that and understand its value, write to me.
              I&apos;ll see whether it&apos;s worth solving. And if it is,
              I&apos;ll take your problem and hand you back a working
              mechanism.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 lg:items-start">
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="interactive"
                className={buttonClass}
              >
                Message on Telegram
              </a>
              <a
                href={MAX_URL}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="interactive"
                className={buttonClass}
              >
                Message on MAX
              </a>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter lang="en" />
    </main>
  );
}
