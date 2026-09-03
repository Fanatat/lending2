"use client";

import { useEffect, useRef, useState } from "react";
import { useLabStore } from "@/lib/store";
import { useReducedMotion } from "@/lib/motion";

const TARGET = "sudo";
const CLOSE_BUTTON_DELAY_MS = 5000;
export const SUDO_LOCK_KEY = "lab-terminal:sudo-locked";
export const SUDO_LOCK_HTML_CLASS = "sudo-locked-boot";

/**
 * Footer hint (see SudoHint) suggests typing "sudo" — this is the payoff: a
 * global keydown listener, no input field involved, watches for the word
 * and locks the screen behind a fullscreen "ДОСТУП ЗАПРЕЩЁН" warning. No
 * auto-dismiss: a close (×) button appears after a delay (like a video ad's
 * skip timer) and that's the only way out. The lock survives a reload —
 * see SUDO_LOCK_KEY in localStorage — and app/layout.tsx has a
 * synchronous inline script that adds SUDO_LOCK_HTML_CLASS to <html>
 * *before* React hydrates, so a reload while locked never flashes the
 * normal page before the lock re-engages; this component's own overlay
 * markup is always present in the DOM (just `display:none` by default)
 * specifically so that class has something to show immediately.
 *
 * Kept independent from AccessDeniedOverlay's `portfolio.readOnly` console
 * egg — same visual beat, unrelated trigger, no reason to couple the two.
 *
 * Desktop-only by nature: there's no on-screen keyboard to type "sudo" on
 * touch, and that's an acceptable trade-off rather than inventing a
 * separate touch trigger that would dilute the joke.
 */
export default function SudoEasterEgg() {
  const reducedMotion = useReducedMotion();
  // Both start false to match the server-rendered markup exactly (SSR has
  // no access to localStorage) — the mount effect below syncs the real
  // value immediately after, while the inline boot script already covers
  // the visual gap.
  const [locked, setLocked] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const bufferRef = useRef("");
  const markFound = useLabStore((s) => s.markFound);

  function engageLock() {
    setLocked(true);
    setShowClose(false);
    try {
      window.localStorage.setItem(SUDO_LOCK_KEY, "1");
    } catch {
      // localStorage unavailable — lock still works for this page view,
      // it just won't survive a reload.
    }
    document.documentElement.classList.add(SUDO_LOCK_HTML_CLASS);
  }

  function releaseLock() {
    setLocked(false);
    setShowClose(false);
    try {
      window.localStorage.removeItem(SUDO_LOCK_KEY);
    } catch {
      // ignore
    }
    document.documentElement.classList.remove(SUDO_LOCK_HTML_CLASS);
  }

  useEffect(() => {
    let alreadyLocked = false;
    try {
      alreadyLocked = window.localStorage.getItem(SUDO_LOCK_KEY) === "1";
    } catch {
      alreadyLocked = false;
    }
    if (alreadyLocked) setLocked(true);
  }, []);

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key.length !== 1) return;
      bufferRef.current = (bufferRef.current + e.key.toLowerCase()).slice(
        -TARGET.length
      );
      if (bufferRef.current === TARGET) {
        bufferRef.current = "";
        engageLock();
        markFound("sudo");
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markFound]);

  useEffect(() => {
    if (!locked) return;
    const t = window.setTimeout(() => setShowClose(true), CLOSE_BUTTON_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [locked]);

  return (
    <div
      id="sudo-lock-overlay"
      role={locked ? "alert" : undefined}
      aria-hidden={!locked}
      className={locked ? "sudo-lock-overlay sudo-lock-overlay--active" : "sudo-lock-overlay"}
      style={
        locked && !reducedMotion ? { animation: "access-denied-flash 300ms ease-out" } : undefined
      }
    >
      {showClose && (
        <button
          type="button"
          data-cursor="interactive"
          onClick={releaseLock}
          aria-label="Закрыть"
          className="absolute right-4 top-4 h-8 w-8 border border-[#0a0a0a] text-lg text-[#0a0a0a]"
        >
          ×
        </button>
      )}
      <p className="max-w-lg px-6 text-center text-2xl font-bold uppercase tracking-widest text-[#0a0a0a] sm:text-4xl">
        Доступ запрещён
      </p>
    </div>
  );
}
