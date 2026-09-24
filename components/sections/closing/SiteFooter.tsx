import HeapSweep from "@/components/effects/HeapSweep";

const START_YEAR = 2026;

/** Minimal legal footer — copyright, protection notice. Very bottom of the page. */
export default function SiteFooter() {
  const year = new Date().getFullYear();
  const yearLabel = year > START_YEAR ? `${START_YEAR}–${year}` : `${START_YEAR}`;

  return (
    <footer className="border-t border-line px-4 py-6 text-center text-[10px] text-fg-muted/60 sm:px-6 md:px-10 lg:px-16">
      <p>© {yearLabel} Валера. Все права защищены.</p>
      <p className="mt-1">
        Копирование и использование материалов сайта без письменного согласия автора запрещено.
      </p>
      <p className="mt-1">
        Текстуры планет:{" "}
        <a
          href="https://www.solarsystemscope.com/textures/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:underline"
        >
          Solar System Scope
        </a>{" "}
        (CC BY 4.0). Звуки:{" "}
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
      <HeapSweep />
    </footer>
  );
}
