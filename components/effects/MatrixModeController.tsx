"use client";

import { useEffect } from "react";
import { useLabStore } from "@/lib/store";

/**
 * Hydrates persisted easter-egg state from localStorage on mount and keeps
 * <html class="matrix-mode"> in sync with the store. Renders nothing.
 */
export default function MatrixModeController() {
  const matrixMode = useLabStore((s) => s.matrixMode);
  const hydrateFromStorage = useLabStore((s) => s.hydrateFromStorage);

  useEffect(() => {
    hydrateFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("matrix-mode", matrixMode);
  }, [matrixMode]);

  return null;
}
