import HeapSweep from "@/components/effects/HeapSweep";

const START_YEAR = 2026;

const COPY = {
  ru: {
    rights: "Валера. Все права защищены.",
    notice: "Копирование и использование материалов сайта без письменного согласия автора запрещено.",
    textures: "Текстуры планет:",
    sounds: "Звуки:",
  },
  en: {
    rights: "Valery. All rights reserved.",
    notice: "Copying or using the site's materials without the author's written consent is prohibited.",
    textures: "Planet textures:",
    sounds: "Sounds:",
  },
};

/** Minimal legal footer — copyright, protection notice. Very bottom of the page. */
export default function SiteFooter({ lang = "ru" }: { lang?: "ru" | "en" }) {
  const year = new Date().getFullYear();
  const yearLabel = year > START_YEAR ? `${START_YEAR}–${year}` : `${START_YEAR}`;
  const t = COPY[lang];

  return (
    <footer className="border-t border-line px-4 py-6 text-center text-[10px] text-fg-muted/60 sm:px-6 md:px-10 lg:px-16">
      <p>© {yearLabel} {t.rights}</p>
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
