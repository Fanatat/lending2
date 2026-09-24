"use client";

import { asset } from "@/lib/site";

/**
 * Planet textures for the intro's parade (components/intro/IntroCosmos).
 * Source: Solar System Scope, https://www.solarsystemscope.com/textures/
 * (CC BY 4.0), resized for the web — see public/textures/planets/CREDITS.md.
 *
 * Loaded as plain images, once per page, while the sound gate is on screen,
 * so the parade opens fully textured instead of popping in.
 */

export const COSMOS_TEXTURES = [
  "sun",
  "mercury",
  "venus_atmosphere",
  "earth_daymap",
  "earth_clouds",
  "moon",
  "mars",
  "jupiter",
  "saturn",
  "saturn_ring",
  "uranus",
  "neptune",
  "stars_milky_way",
] as const;

export type CosmosTexture = (typeof COSMOS_TEXTURES)[number];

const images = new Map<CosmosTexture, HTMLImageElement>();
let pending: Promise<void> | null = null;
let loaded = 0;
const listeners = new Set<(progress: number) => void>();

function src(name: CosmosTexture) {
  return asset(`/textures/planets/${name}.${name === "saturn_ring" ? "png" : "jpg"}`);
}

/** Starts (or joins) the download; resolves once every image has settled. */
export function loadCosmosAssets(): Promise<void> {
  if (pending) return pending;
  // The renderer's own chunk downloads alongside the images.
  const engine = import("three").catch(() => undefined);
  pending = Promise.all([
    engine,
    ...COSMOS_TEXTURES.map(
      (name) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.decoding = "async";
          img.onload = () => {
            images.set(name, img);
            done();
            resolve();
          };
          // A missing texture just leaves that body in its flat fallback colour.
          img.onerror = () => {
            done();
            resolve();
          };
          img.src = src(name);
        })
    ),
  ]).then(() => undefined);
  return pending;
}

function done() {
  loaded += 1;
  const p = loaded / COSMOS_TEXTURES.length;
  listeners.forEach((fn) => fn(p));
}

/** 0..1 share of textures settled so far; `fn` hears every change. */
export function onCosmosProgress(fn: (progress: number) => void) {
  listeners.add(fn);
  fn(loaded / COSMOS_TEXTURES.length);
  return () => {
    listeners.delete(fn);
  };
}

export function cosmosImage(name: CosmosTexture): HTMLImageElement | undefined {
  return images.get(name);
}
