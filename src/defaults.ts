/**
 * Sensible rules for ordinary web controls, so `{ sounds: glass, rules: defaultRules }`
 * is a complete config. Put your own rules first to override any of these.
 */

import type { Purpose } from "./design.ts";
import type { Rule } from "./rules.ts";

const INTERACTIVE = "a[href], button, summary, [role=button], [role=link], [role=menuitem], [role=option], [role=tab]";

/** Maps a range input's position to a gentle rise in pitch, so dragging a slider feels like moving along something. */
function slidePitch(element: Element) {
  if (!(element instanceof HTMLInputElement)) return 0;
  const min = Number(element.min || 0);
  const max = Number(element.max || 100);
  const position = max > min ? (Number(element.value) - min) / (max - min) : 0;
  return position * 12 - 4;
}

export const defaultRules: readonly Rule<Purpose>[] = [
  { match: "input[type=range]", on: "slide", play: "slide", pitch: slidePitch },
  { match: "input[type=checkbox]", on: "change", play: (element) => (element instanceof HTMLInputElement && element.checked ? "toggleOn" : "toggleOff") },
  { match: "input[type=radio], select", on: "change", play: "select" },
  { match: "input, textarea, [contenteditable]", on: "type", play: "type" },
  // aria-checked still holds the old state during the click, because the app updates it afterwards.
  { match: "[role=switch]", on: "click", play: (element) => (element.getAttribute("aria-checked") === "true" ? "toggleOff" : "toggleOn") },
  { match: "[type=submit]", on: "click", play: "send" },
  { match: "summary, [aria-haspopup]", on: "click", play: "open" },
  { match: "[role=option], [role=menuitem], [role=tab]", on: "click", play: "select" },
  { match: "a[href]", on: "click", play: "navigate" },
  { match: "button, [role=button]", on: "click", play: "tap" },
  { match: INTERACTIVE, on: "hover", play: "hover" },
];
