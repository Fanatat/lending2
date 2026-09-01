"use client";

import { useState, type FormEvent } from "react";
import { AGENTS, CANNED_REPLIES } from "@/components/sections/staff/agents";

interface Message {
  from: "user" | "agent";
  text: string;
}

/** Minimal chat simulator: user message → a scripted, agent-specific reply. */
export default function StaffChatSim() {
  const [activeId, setActiveId] = useState(AGENTS[0]!.id);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const replies = CANNED_REPLIES[activeId] ?? ["..."];
    const reply = replies[Math.floor(Math.random() * replies.length)]!;
    setMessages((m) => [...m, { from: "user", text }, { from: "agent", text: reply }]);
    setDraft("");
  }

  const activeAgent = AGENTS.find((a) => a.id === activeId)!;

  return (
    <div className="border border-line bg-panel">
      <div className="flex flex-wrap gap-2 border-b border-line p-3">
        {AGENTS.map((a) => (
          <button
            key={a.id}
            type="button"
            data-cursor="interactive"
            onClick={() => {
              setActiveId(a.id);
              setMessages([]);
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

      <div className="min-h-[160px] space-y-2 p-4 text-sm">
        <p className="text-xs text-fg-muted">
          Чат с: {activeAgent.name} — {activeAgent.status}
        </p>
        {messages.length === 0 && (
          <p className="text-xs text-fg-muted">Напишите что-нибудь ниже.</p>
        )}
        {messages.map((m, i) => (
          <p
            key={i}
            className={m.from === "user" ? "text-fg-primary" : "text-accent"}
          >
            {m.from === "user" ? "вы: " : `${activeAgent.initials}: `}
            {m.text}
          </p>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex border-t border-line">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Сообщение..."
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
