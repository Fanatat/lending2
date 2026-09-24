"use client";

import { create } from "zustand";

export type EasterEggId =
  | "matrix"
  | "system4"
  | "unicorn"
  | "branch"
  | "sudo"
  | "heap"
  | "hacker"
  | "breath"
  | "console"
  | "konami"
  | "corner"
  | "receipt"
  | "party";

export interface EasterEggMeta {
  id: EasterEggId;
  title: string;
  /** Shown while still hidden — a nudge, not the answer. */
  hint: string;
  /** Shown once found. */
  found: string;
}

/** Canonical roster of every discoverable easter egg — drives the counter, its hint list and the toast. */
export const EASTER_EGGS: EasterEggMeta[] = [
  { id: "matrix", title: "Красная таблетка", hint: "Заголовок не любит, когда его торопят. Раз, два, три, четыре, пять.", found: "Пять быстрых кликов по заголовку включают Матрицу." },
  { id: "system4", title: "Скрытая система", hint: "Систем восемь, а на странице видно семь.", found: "СИСТЕМА 04 показывается только в Матрице." },
  { id: "unicorn", title: "Единорог", hint: "Мост очень не любит, когда IPv6 дёргают без остановки.", found: "Десять переключений IPv6 за пять секунд." },
  { id: "heap", title: "Завал", hint: "Если мост сломать и не чинить, внизу станет тесно.", found: "Шестьдесят бегунов упали с моста на дно страницы." },
  { id: "branch", title: "Ветка", hint: "В самом низу есть точка. Посветите вокруг.", found: "Фонарик нашёл все пять будущих проектов." },
  { id: "sudo", title: "sudo", hint: "Оператору внизу страницы разрешили набрать одно слово.", found: "Набрали «sudo» — и получили то, что заслужили." },
  { id: "hacker", title: "Периметр", hint: "Посмотрите на карту сети подольше. Кто-то тоже на неё смотрит.", found: "Нарушитель пойман до того, как добрался до сервера." },
  { id: "breath", title: "Подышать на датчик", hint: "Плата HP100 чувствует, если долго держать курсор на CO₂.", found: "CO₂ улетел за порог — плата подняла тревогу." },
  { id: "console", title: "Консоль", hint: "F12. Портфель только для чтения… пока.", found: "portfolio.readOnly = false — числа всё равно считает Python." },
  { id: "konami", title: "Код разработчика", hint: "↑ ↑ ↓ ↓ … дальше вы знаете.", found: "Konami-код показывает страницу глазами агента." },
  { id: "corner", title: "Угол", hint: "Оставьте страницу в покое на минуту. И дождитесь угла.", found: "Заставка попала точно в угол." },
  { id: "receipt", title: "Чек", hint: "Итог в 2 000 ₽ можно пробить. Трижды.", found: "Касса пробила чек за всю инфраструктуру." },
  { id: "party", title: "Корпоратив", hint: "С агентами штаба можно переписываться на странице проекта. Есть команда, после которой они не работают.", found: "/party в чате штаба." },
];

export const ALL_EASTER_EGGS: EasterEggId[] = EASTER_EGGS.map((e) => e.id);

const STORAGE_KEY = "lab-terminal:found-easter-eggs";

function loadFound(): EasterEggId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistFound(ids: EasterEggId[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage unavailable (private mode, quota) — easter eggs just won't persist.
  }
}

const SOUND_KEY = "lab-terminal:sound-enabled";

function loadSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(SOUND_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

interface LabStore {
  matrixMode: boolean;
  unicornMode: boolean;
  foundEasterEggs: EasterEggId[];
  soundEnabled: boolean;
  /** Running count of clicks on the Hero title toward the 5-click matrix
   * gesture (see HeroTitleReveal's handleClick) — independent of
   * foundEasterEggs. The "АНОМАЛИЯ N/5" toast (AnomalyBanner) reads this
   * directly so it reflects click progress, not eggs already found. */
  matrixClickCount: number;
  setMatrixMode: (on: boolean) => void;
  setUnicornMode: (on: boolean) => void;
  markFound: (id: EasterEggId) => void;
  hydrateFromStorage: () => void;
  toggleSound: () => void;
  setSound: (on: boolean) => void;
  setMatrixClickCount: (n: number) => void;
}

export const useLabStore = create<LabStore>((set, get) => ({
  matrixMode: false,
  unicornMode: false,
  foundEasterEggs: [],
  soundEnabled: true,
  matrixClickCount: 0,
  setMatrixMode: (on) => set({ matrixMode: on }),
  setUnicornMode: (on) => set({ unicornMode: on }),
  setMatrixClickCount: (n) => set({ matrixClickCount: n }),
  markFound: (id) => {
    const current = get().foundEasterEggs;
    if (current.includes(id)) return;
    const next = [...current, id];
    set({ foundEasterEggs: next });
    persistFound(next);
  },
  hydrateFromStorage: () => {
    // `found` is a permanent "discovered this egg once" record used for
    // achievement tracking — it must not double as the live matrixMode
    // toggle, or the mint/matrix look would come back on every visit after
    // the first time someone finds it instead of needing the 5-click trigger
    // again.
    const found = loadFound();
    set({
      foundEasterEggs: found,
      soundEnabled: loadSoundEnabled(),
    });
  },
  toggleSound: () => get().setSound(!get().soundEnabled),
  setSound: (on) => {
    set({ soundEnabled: on });
    try {
      window.localStorage.setItem(SOUND_KEY, on ? "1" : "0");
    } catch {
      // ignore
    }
  },
}));
