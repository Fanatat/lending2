import HeapSweep from "@/components/effects/HeapSweep";
import IntroReplayButton from "@/components/intro/IntroReplayButton";
import { SITE_REPO_URL } from "@/lib/site";

const START_YEAR = 2026;

const COPY = {
  ru: {
    rights: "Валера. Все права защищены.",
    notice: "Копирование и использование материалов сайта без письменного согласия автора запрещено.",
    textures: "Текстуры планет:",
    sounds: "Звуки:",
    source: "Код этого сайта",
    replayIntro: "Смотреть интро снова",
  },
  en: {
    rights: "Valery. All rights reserved.",
    notice: "Copying or using the site's materials without the author's written consent is prohibited.",
    textures: "Planet textures:",
    sounds: "Sounds:",
    source: "This site's source code",
    replayIntro: "Watch the intro again",
  },
};

/** Minimal legal footer — copyright, protection notice. Very bottom of the page. */
export default function SiteFooter({ lang = "ru" }: { lang?: "ru" | "en" }) {
  const year = new Date().getFullYear();
  const yearLabel = year > START_YEAR ? `${START_YEAR}–${year}` : `${START_YEAR}`;
  const t = COPY[lang];

  return (
    <footer className="border-t border-line px-4 py-6 text-center text-[10px] text-fg-muted/60 sm:px-6 md:px-10 lg:px-16">
      {/* The page is pre-rendered: after New Year the build's year and the
          visitor's differ until the next deploy, and that alone must not
          break hydration. */}
      <p suppressHydrationWarning>© {yearLabel} {t.rights}</p>
      <p className="mt-1">
        <a
          href={SITE_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-accent"
        >
          {t.source} — GitHub ↗
        </a>
        {" · "}
        <IntroReplayButton label={t.replayIntro} />
      </p>
      <p className="mt-1">{t.notice}</p>
      <p className="mt-1">
        {t.textures}{" "}
        <a
          href="https://www.solarsystemscope.com/textures/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:underline"
        >
          Solar System Scope
        </a>{" "}
        (CC BY 4.0). {t.sounds}{" "}
        <a
          href="https://freesound.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:underline"
        >
          Freesound
        </a>{" "}
        (CC0).
      </p>
      {lang === "ru" && <HeapSweep />}
    </footer>
  );
}
