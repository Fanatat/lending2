"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { LEAD_URL, TELEGRAM_URL } from "@/lib/site";

type Lang = "ru" | "en";

const NAME_MAX = 100;
const CONTACT_MAX = 200;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 3000;
const TIMEOUT_MS = 20_000;

// Same checks the server runs — the client only saves a round trip.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEGRAM_RE = /^(@|https?:\/\/t\.me\/)[A-Za-z0-9_]{4,}$/;
const PHONE_RE = /^\+?[\d\s()-]{10,20}$/;

function isValidContact(value: string) {
  return EMAIL_RE.test(value) || TELEGRAM_RE.test(value) || PHONE_RE.test(value);
}

const COPY = {
  ru: {
    kicker: "Заявка",
    title: "Опишите рутинную задачу двумя фразами — отвечу, как её автоматизировать и за какой срок.",
    name: "Как к вам обращаться",
    nameHint: "необязательно",
    namePlaceholder: "Имя",
    contact: "Почта, @ник в Telegram или телефон",
    contactPlaceholder: "@nickname, you@mail.ru или +7…",
    message: "Задача",
    messagePlaceholder:
      "Например: каждую неделю вручную сводим отчёт из трёх таблиц и рассылаем его в чат.",
    submit: "Отправить заявку",
    sending: "Отправляю…",
    privacy:
      "Заявку прочитаю я; для разбора по пунктам её видит ИИ на моём сервере. Никому не передаю.",
    contactError: "Укажите почту, @ник в Telegram (от 4 символов) или телефон.",
    messageShort: `Опишите задачу хотя бы в ${MESSAGE_MIN} символов.`,
    badRequest: "Проверьте поля формы.",
    rateLimited: "Слишком много заявок подряд.",
    rateHint: "Можно написать напрямую",
    failed: "Не получилось отправить. Напишите напрямую",
    failedTail: "— текст заявки остался в форме.",
    inTelegram: "в Telegram",
    successTitle: "Заявка у меня.",
    successText: "Отвечу в течение дня — в Telegram или на почту, что вы указали.",
    counter: "символов",
  },
  en: {
    kicker: "Request",
    title: "Describe a routine task in two sentences — I'll tell you how to automate it and how long it would take.",
    name: "What should I call you",
    nameHint: "optional",
    namePlaceholder: "Name",
    contact: "Email, Telegram @handle or phone",
    contactPlaceholder: "@nickname, you@mail.com or +1…",
    message: "Task",
    messagePlaceholder:
      "For example: every week we merge a report from three spreadsheets by hand and post it to a chat.",
    submit: "Send request",
    sending: "Sending…",
    privacy:
      "I'll read your request myself; an AI on my own server sees it to break it down into points. I don't share it with anyone.",
    contactError: "Enter an email, a Telegram @handle (4+ characters) or a phone number.",
    messageShort: `Describe the task in at least ${MESSAGE_MIN} characters.`,
    badRequest: "Please check the form fields.",
    rateLimited: "Too many requests in a row.",
    rateHint: "You can message me directly",
    failed: "Couldn't send it. Message me directly",
    failedTail: "— your text is still in the form.",
    inTelegram: "on Telegram",
    successTitle: "Your request is with me.",
    successText: "I'll reply within a day — on Telegram or by email, whichever you left.",
    counter: "characters",
  },
} as const;

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "invalid"; text: string }
  | { kind: "rate"; text: string }
  | { kind: "failed" };

type FieldErrors = { contact?: string; message?: string };

const fieldClass =
  "mt-1 w-full border border-line bg-void px-3 py-2 text-base text-fg-primary outline-none transition-colors placeholder:text-fg-muted/70 focus:border-accent aria-[invalid=true]:border-red-400/70 sm:text-sm";
const labelClass = "block text-xs text-fg-muted";
const buttonClass =
  "inline-block border border-accent px-6 py-3 text-sm text-accent transition-[filter] duration-200 hover:[filter:drop-shadow(0_0_6px_var(--accent))] disabled:cursor-wait disabled:opacity-60 disabled:hover:[filter:none]";
const linkClass =
  "text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent";

async function readError(res: Response): Promise<string | null> {
  try {
    const data = (await res.json()) as { error?: unknown };
    return typeof data.error === "string" && data.error.trim() ? data.error : null;
  } catch {
    return null;
  }
}

/**
 * Contact form of the closing section. Posts JSON to LEAD_URL; on any
 * failure the inputs stay as typed and Telegram is offered instead, so a
 * visitor never loses what they wrote.
 */
export default function LeadForm({ lang = "ru" }: { lang?: Lang }) {
  const t = COPY[lang];
  const id = useId();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const contactRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (status.kind === "sent") successRef.current?.focus();
  }, [status.kind]);

  const sending = status.kind === "sending";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;

    const payload = {
      name: name.trim(),
      contact: contact.trim(),
      message: message.trim(),
      website,
      page: window.location.pathname,
      lang,
    };

    const nextErrors: FieldErrors = {};
    if (!isValidContact(payload.contact)) nextErrors.contact = t.contactError;
    if (payload.message.length < MESSAGE_MIN) nextErrors.message = t.messageShort;
    setErrors(nextErrors);
    if (nextErrors.contact || nextErrors.message) {
      setStatus({ kind: "idle" });
      (nextErrors.contact ? contactRef : messageRef).current?.focus();
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
    setStatus({ kind: "sending" });

    try {
      const res = await fetch(LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (res.ok) {
        setStatus({ kind: "sent" });
      } else if (res.status === 400) {
        setStatus({ kind: "invalid", text: (await readError(res)) ?? t.badRequest });
      } else if (res.status === 429) {
        setStatus({ kind: "rate", text: (await readError(res)) ?? t.rateLimited });
      } else {
        setStatus({ kind: "failed" });
      }
    } catch {
      // Network error, CORS refusal or the 20-second timeout.
      setStatus({ kind: "failed" });
    } finally {
      window.clearTimeout(timer);
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  const telegramLink = (
    <a
      href={TELEGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      data-cursor="interactive"
      className={linkClass}
    >
      {t.inTelegram}
    </a>
  );

  return (
    <div className="relative border border-line bg-panel p-5 sm:p-6">
      <div className="text-[10px] uppercase tracking-wide text-fg-muted">{t.kicker}</div>
      <h3 className="mt-3 text-base leading-relaxed text-fg-primary sm:text-lg">{t.title}</h3>

      {status.kind === "sent" ? (
        <div ref={successRef} tabIndex={-1} className="mt-6 outline-none" role="status">
          <p className="text-lg text-accent">{t.successTitle}</p>
          <p className="mt-2 text-sm leading-relaxed text-fg-primary/90">{t.successText}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${id}-name`} className={labelClass}>
                {t.name} <span className="text-fg-muted/60">· {t.nameHint}</span>
              </label>
              <input
                id={`${id}-name`}
                name="name"
                type="text"
                autoComplete="name"
                maxLength={NAME_MAX}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.namePlaceholder}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor={`${id}-contact`} className={labelClass}>
                {t.contact}
              </label>
              <input
                ref={contactRef}
                id={`${id}-contact`}
                name="contact"
                type="text"
                required
                autoComplete="email"
                autoCapitalize="off"
                spellCheck={false}
                maxLength={CONTACT_MAX}
                value={contact}
                onChange={(e) => {
                  setContact(e.target.value);
                  if (errors.contact) setErrors((x) => ({ ...x, contact: undefined }));
                }}
                placeholder={t.contactPlaceholder}
                aria-invalid={errors.contact ? true : undefined}
                aria-describedby={errors.contact ? `${id}-contact-error` : undefined}
                className={fieldClass}
              />
              {errors.contact && (
                <p id={`${id}-contact-error`} className="mt-1 text-xs text-red-400">
                  {errors.contact}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor={`${id}-message`} className={labelClass}>
              {t.message}
            </label>
            <textarea
              ref={messageRef}
              id={`${id}-message`}
              name="message"
              required
              rows={5}
              minLength={MESSAGE_MIN}
              maxLength={MESSAGE_MAX}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errors.message) setErrors((x) => ({ ...x, message: undefined }));
              }}
              placeholder={t.messagePlaceholder}
              aria-invalid={errors.message ? true : undefined}
              aria-describedby={`${id}-message-count${errors.message ? ` ${id}-message-error` : ""}`}
              className={`${fieldClass} resize-y`}
            />
            <div className="mt-1 flex items-start justify-between gap-3 text-xs">
              <p id={`${id}-message-error`} className="text-red-400">
                {errors.message}
              </p>
              <p id={`${id}-message-count`} className="shrink-0 tabular-nums text-fg-muted/70">
                {message.length}/{MESSAGE_MAX} <span className="sr-only">{t.counter}</span>
              </p>
            </div>
          </div>

          {/* Honeypot: off-screen rather than display:none, so naive bots
              still fill it in; people never reach it. */}
          <div aria-hidden="true" className="absolute -left-[10000px] top-0 h-px w-px overflow-hidden">
            <label htmlFor={`${id}-website`}>Website</label>
            <input
              id={`${id}-website`}
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div className="flex justify-center sm:justify-start">
            <button
              type="submit"
              disabled={sending}
              aria-busy={sending}
              data-cursor="interactive"
              className={buttonClass}
            >
              {sending ? t.sending : t.submit}
            </button>
          </div>
          <p className="text-center text-[11px] leading-relaxed text-fg-muted sm:text-left">
            {t.privacy}
          </p>
        </form>
      )}

      <div aria-live="polite" className="text-sm leading-relaxed">
        {status.kind === "invalid" && <p className="mt-4 text-red-400">{status.text}</p>}
        {status.kind === "rate" && (
          <p className="mt-4 text-red-400">
            {status.text}{" "}
            <span className="text-fg-primary">
              {t.rateHint} {telegramLink}.
            </span>
          </p>
        )}
        {status.kind === "failed" && (
          <p className="mt-4 text-red-400">
            {t.failed} {telegramLink} <span className="text-fg-primary">{t.failedTail}</span>
          </p>
        )}
      </div>
    </div>
  );
}
