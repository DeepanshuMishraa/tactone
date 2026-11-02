/**
 * Light or dark. The site follows the system until someone picks, then
 * remembers the pick per browser. The inline script in each page's <head>
 * applies a stored pick before first paint, so there is no flash.
 */

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const KEY = "tactone.site.theme";
const query = window.matchMedia("(prefers-color-scheme: dark)");

const system = (): Theme => (query.matches ? "dark" : "light");

function stored(): Theme | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

let theme: Theme = stored() ?? system();
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  // With no stored pick, a system switch carries the site with it.
  const follow = () => {
    if (stored() !== null) return;
    theme = system();
    listener();
  };
  query.addEventListener("change", follow);
  return () => {
    listeners.delete(listener);
    query.removeEventListener("change", follow);
  };
};

function apply(next: Theme) {
  theme = next;
  document.documentElement.dataset.theme = next;
  for (const listener of listeners) listener();
}

export const Theme = {
  use: () => useSyncExternalStore(subscribe, () => theme),
  toggle: () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Storage is only a convenience. The new theme still applies for this visit.
    }
    // Cross-fade the whole page where the browser can, unless the reader asked for less motion.
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (calm || document.startViewTransition === undefined) apply(next);
    else document.startViewTransition(() => apply(next));
  },
} as const;
