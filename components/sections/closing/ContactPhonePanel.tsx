"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/motion";
import { useLabStore, ALL_EASTER_EGGS } from "@/lib/store";

// The number never sits in source or the shipped bundle as a literal,
// phone-shaped string — only as this char-code array, decoded in-browser
// and only once the panel is actually opened by a click. Search engines and
// static page scanners read markup/JS text, not runtime state from a user
// gesture, so the digits are never present for them to index or harvest.
const ENCODED = [43, 55, 57, 49, 53, 54, 54, 56, 54, 48, 55, 54];

function decodePhone() {
  return String.fromCharCode(...ENCODED);
}

interface ContactPhonePanelProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Bottom bar that slides up on demand with the phone number. The bar itself
 * stays in the DOM at all times (so the slide-up transition has something to
 * animate) and is only pushed off-screen + `aria-hidden` + `pointer-events:
 * none` while closed — so its one always-rendered control (the close button)
 * gets `tabIndex={-1}` when closed too, or a keyboard user tabbing through
 * the page would land focus on an invisible, unclickable button.
 *
 * The number itself only decodes into markup once ALL_EASTER_EGGS have all
 * been found — until then the panel shows how many are left instead, so the
 * digits are never present in the DOM for a scanner or a casual visitor to
 * pick up, gated or not.
 */
export default function ContactPhonePanel({ open, onClose }: ContactPhonePanelProps) {
  const reducedMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const foundCount = useLabStore((s) => s.foundEasterEggs.length);
  const total = ALL_EASTER_EGGS.length;
  const unlocked = foundCount >= total;

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  async function handleCopy() {
    if (!unlocked) return;
    const phone = decodePhone();
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — the number is still selectable by hand.
    }
  }

  return (
    <div
      aria-hidden={!open}
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4"
      style={{
        transform: open ? "translateY(0)" : "translateY(120%)",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        transition: reducedMotion
          ? "none"
          : "transform 350ms ease, opacity 350ms ease",
      }}
    >
      <div className="flex w-full max-w-sm items-center justify-between gap-4 border border-accent bg-panel px-4 py-3 shadow-[0_0_20px_rgba(0,0,0,0.4)]">
        <div className="min-w-0">
          <div className="text-[10px] tracking-widest text-fg-muted">
            ДОБАВИТЬ ПО НОМЕРУ
          </div>
          {open && unlocked && (
            <button
              type="button"
              data-cursor="interactive"
              onClick={handleCopy}
              className="mt-1 block text-left text-sm text-fg-primary sm:text-base"
              style={{ letterSpacing: "0.12em" }}
              aria-label="Скопировать номер телефона"
            >
              {decodePhone()}
            </button>
          )}
          {open && !unlocked && (
            <p className="mt-1 max-w-[220px] text-left text-[11px] leading-snug text-fg-muted">
              Номер скрыт. Разблокируется после {foundCount}/{total} найденных
              пасхалок на странице.
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span
            className="text-[10px] text-accent transition-opacity duration-200"
            style={{ opacity: copied ? 1 : 0 }}
          >
            Скопировано
          </span>
          <button
            type="button"
            data-cursor="interactive"
            onClick={onClose}
            aria-label="Закрыть"
            tabIndex={open ? 0 : -1}
            className="text-fg-muted hover:text-accent"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
