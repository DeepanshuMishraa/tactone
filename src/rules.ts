/**
 * Which sound, if any, an interaction earns. Attributes on the element beat
 * rules, and earlier rules beat later ones, so a page can carve exceptions out
 * of a broad config without touching it.
 */

export type Trigger = "click" | "press" | "release" | "hover" | "focus" | "type" | "change" | "slide";

export type PlayOptions = {
  /** Multiplies this play's level, 0 to 1 or above for a boost. */
  readonly volume?: number;
  /** Semitones up or down for this play. */
  readonly pitch?: number;
};

export type Rule<Name extends string> = Pick<PlayOptions, "volume"> & {
  /** CSS selector. The closest matching ancestor counts, so icons inside a button still match. */
  readonly match: string;
  readonly on: Trigger;
  /** Semitones up or down, or a function that reads them from the matched element. */
  readonly pitch?: number | ((element: Element) => number);
  /** A sound name, or a function that picks one from the matched element. Return null for silence. */
  readonly play: Name | ((element: Element, event: Event) => Name | null);
  /** Minimum milliseconds between plays of this rule. */
  readonly throttle?: number;
};

export type Decision<Name extends string> =
  | { readonly kind: "silent" }
  | { readonly kind: "play"; readonly name: Name; readonly element: Element; readonly rule: Rule<Name> | null }
  | { readonly kind: "unknown"; readonly name: string; readonly element: Element };

const SILENT = { kind: "silent" } as const;
const OFF = "none";

/** Input types where a keystroke is text. Password stays out: keystroke sounds leak its length and rhythm. */
const TEXT_INPUTS = new Set(["", "text", "search", "url", "email", "tel", "number"]);

const isDisabled = (element: Element) => element.closest('[disabled],[aria-disabled="true"]') !== null;

function fromAttribute<Name extends string>(target: Element, trigger: Trigger, isName: (name: string) => name is Name): Decision<Name> | null {
  const specific = `data-sound-${trigger}`;
  const element = target.closest(`[${specific}],[data-sound]`);
  if (element === null) return null;
  const value = element.getAttribute(specific) ?? element.getAttribute("data-sound");
  if (value === null) return null;
  if (value === OFF) return SILENT;
  // A bare data-sound is shorthand for click. It only silences (above) on the other triggers.
  if (!element.hasAttribute(specific) && trigger !== "click") return null;
  return isName(value) ? { kind: "play", name: value, element, rule: null } : { kind: "unknown", name: value, element };
}

export const Rules = {
  /** Decides what this event plays. Pure over its inputs, apart from calling a rule's own `play` function. */
  decide: <Name extends string>(rules: readonly Rule<Name>[], trigger: Trigger, target: Element, event: Event, isName: (name: string) => name is Name): Decision<Name> => {
    if (isDisabled(target)) return SILENT;
    const attribute = fromAttribute(target, trigger, isName);
    if (attribute !== null) return attribute;
    for (const rule of rules) {
      if (rule.on !== trigger) continue;
      const element = target.closest(rule.match);
      if (element === null) continue;
      const name = typeof rule.play === "function" ? rule.play(element, event) : rule.play;
      return name === null ? SILENT : { kind: "play", name, element, rule };
    }
    return SILENT;
  },

  /** A keydown that changes text in a field that may sound. Never a password, never a shortcut. */
  isTextEdit: (event: KeyboardEvent, target: Element): boolean => {
    if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return false;
    if (event.key.length !== 1 && event.key !== "Backspace" && event.key !== "Delete" && event.key !== "Enter") return false;
    if (target instanceof HTMLInputElement) return TEXT_INPUTS.has(target.getAttribute("type") ?? "") && !target.readOnly;
    if (target instanceof HTMLTextAreaElement) return !target.readOnly;
    return target instanceof HTMLElement && target.isContentEditable;
  },
} as const;
