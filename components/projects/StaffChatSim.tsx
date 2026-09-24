"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AGENTS, CANNED_REPLIES, TOPIC_REPLIES, PARTY_LINES } from "@/components/sections/staff/agents";
import { useLabStore } from "@/lib/store";
import { playSfx } from "@/lib/sfx";

interface Message {
  from: "user" | "agent" | "system";
  /** Agent initials for agent lines — /party makes several agents talk at once. */
  who?: string;
  text: string;
}

const HELP_TEXT =
  "Команды: /status — сводка по отделам, /help — эта подсказка. Есть ещё одна, но её тут не пишут.";

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)]!;
}

/** Keyword → topic, checked in order; the first hit decides the reply pool. */
const TOPICS: [RegExp, string][] = [
  [/привет|здравств|добр(ый|ое)|hi|hello/i, "greet"],
  [/статус|как дела|что нового|отчёт|отчет/i, "status"],
  [/деньг|стоит|цена|₽|руб|бюджет/i, "money"],
  [/спасибо|благодар|круто|класс/i, "thanks"],
  [/ты кто|кто ты|человек|бот|нейросеть|ии\b|ai\b/i, "whoami"],
];

/**
 * Chat simulator for the Staff project page. Each agent answers in its own
 * voice with a short "печатает…" delay; a few keywords steer the reply, and
 * slash commands exist for the curious (/help, /status, and one unlisted).
 */
export default function StaffChatSim() {
  const [activeId, setActiveId] = useState(AGENTS[0]!.id);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState<string | null>(null);
  const [party, setParty] = useState(false);
  const timers = useRef<number[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const markFound = useLabStore((s) => s.markFound);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const activeAgent = AGENTS.find((a) => a.id === activeId)!;

  function later(ms: number, fn: () => void) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  function agentSays(initials: string, text: string, delay: number) {
    later(delay, () => setTyping(initials));
    later(delay + 500 + Math.min(1400, text.length * 18), () => {
      setTyping(null);
      setMessages((m) => [...m, { from: "agent", who: initials, text }]);
      playSfx("ui_click", { volume: 0.4, rate: 1.3 });
    });
  }

  function startParty() {
    markFound("party");
    setParty(true);
    playSfx("unicorn");
    setMessages((m) => [...m, { from: "system", text: "Координатор объявил перерыв. Все процессы на паузе." }]);
    let t = 300;
    for (const [id, line] of PARTY_LINES) {
      const agent = AGENTS.find((a) => a.id === id);
      if (!agent) continue;
      agentSays(agent.initials, line, t);
      t += 900;
    }
    later(t + 1600, () => {
      setParty(false);
      setMessages((m) => [...m, { from: "system", text: "Перерыв окончен. Штаб вернулся к работе." }]);
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setMessages((m) => [...m, { from: "user", text }]);

    const cmd = text.toLowerCase();
    if (cmd === "/party" || cmd === "/корпоратив") return startParty();
    if (cmd === "/help") {
      setMessages((m) => [...m, { from: "system", text: HELP_TEXT }]);
      return;
    }
    if (cmd === "/status") {
      let t = 200;
      for (const a of AGENTS) {
        agentSays(a.initials, pick(TOPIC_REPLIES.status?.[a.id] ?? CANNED_REPLIES[a.id] ?? ["на месте"]), t);
        t += 450;
      }
      return;
    }

    const topic = TOPICS.find(([re]) => re.test(text))?.[1];
    const pool =
      (topic && TOPIC_REPLIES[topic]?.[activeId]) || CANNED_REPLIES[activeId] || ["..."];
    agentSays(activeAgent.initials, pick(pool), 150);
  }

  return (
    <div className={`border bg-panel transition-colors ${party ? "staff-party border-accent" : "border-line"}`}>
      <div className="flex flex-wrap gap-2 border-b border-line p-3">
        {AGENTS.map((a) => (
          <button
            key={a.id}
            type="button"
            data-cursor="interactive"
            onClick={() => {
              setActiveId(a.id);
              setMessages([]);
              setTyping(null);
              playSfx("ui_click");
            }}
            className={`border px-2 py-1 text-[10px] ${
              a.id === activeId
                ? "border-accent text-accent"
                : "border-line text-fg-muted"
            }`}
          >
            {a.initials}
          </button>
        ))}
      </div>

      <div ref={logRef} className="max-h-[320px] min-h-[180px] space-y-2 overflow-y-auto p-4 text-sm">
        <p className="text-xs text-fg-muted">
          Чат с: {activeAgent.name} — {activeAgent.status}
        </p>
        {messages.length === 0 && (
          <p className="text-xs text-fg-muted">
            Напишите что-нибудь: «привет», «как дела», «сколько стоит». Или /help.
          </p>
        )}
        {messages.map((m, i) => (
          <p
            key={i}
            className={
              m.from === "user"
                ? "text-fg-primary"
                : m.from === "system"
                  ? "text-xs italic text-fg-muted"
                  : "text-accent"
            }
          >
            {m.from === "user" ? "вы: " : m.from === "agent" ? `${m.who}: ` : "— "}
            {m.text}
          </p>
        ))}
        {typing && <p className="text-xs text-fg-muted">{typing} печатает…</p>}
      </div>

      <form onSubmit={handleSubmit} className="flex border-t border-line">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Сообщение или /help"
          aria-label="Сообщение штабу"
          className="flex-1 bg-void px-3 py-2 text-base text-fg-primary outline-none placeholder:text-fg-muted sm:text-sm"
        />
        <button
          type="submit"
          data-cursor="interactive"
          className="px-4 text-xs text-accent"
        >
          →
        </button>
      </form>
    </div>
  );
}
