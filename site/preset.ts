/**
 * The preset the whole site plays. Every page runs the real library with
 * `defaultRules`, so pressing anything on the site is the demo. The choice is
 * remembered per browser; missing or blocked storage falls back to glass.
 */

import { useSyncExternalStore } from "react";
import { defaultRules } from "../src/defaults.ts";
import { type Purpose, STYLES, type Style, sets } from "../src/presets.ts";
import type { Rule } from "../src/rules.ts";
import { createSounds } from "../src/sounds.ts";

const PRESET_KEY = "tactone.site.preset";
const FALLBACK: Style = "glass";

/** Surfaces that aren't controls but still answer the pointer, quieter than a real control. */
const RULES: readonly Rule<Purpose>[] = [
  { match: ".point", on: "hover", play: "hover", volume: 0.55 },
  { match: ".table tbody tr", on: "hover", play: "hover", volume: 0.35, throttle: 90 },
  ...defaultRules,
];

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage is only a convenience. The page keeps the new setting for this visit either way.
  }
}

let preset: Style = STYLES.find((style) => style === read(PRESET_KEY)) ?? FALLBACK;
const listeners = new Set<() => void>();
const notify = () => {
  for (const listener of listeners) listener();
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const sounds = createSounds<Purpose>({ sounds: sets[preset], rules: RULES });

export const Preset = {
  set: (style: Style) => {
    preset = style;
    sounds.configure({ sounds: sets[style], rules: RULES });
    write(PRESET_KEY, style);
    notify();
  },
  use: () => useSyncExternalStore(subscribe, () => preset),
} as const;
