/**
 * The app-facing object: one config, delegated listeners at the root, and
 * typed `play`. Creating it touches nothing, so it is safe during SSR.
 */

import { createEngine, type EngineOptions } from "./engine.ts";
import { type Decision, type PlayOptions, type Rule, Rules, type Trigger } from "./rules.ts";
import { Sound } from "./sound.ts";

/** Default gaps per trigger, in milliseconds. Hover and typing fire in bursts and wear out without them. */
const DEFAULT_THROTTLE: Partial<Record<Trigger, number>> = { hover: 60, type: 40, slide: 45 };

export type Config<Name extends string> = EngineOptions & {
  readonly sounds: Readonly<Record<Name, Sound>>;
  readonly rules?: readonly Rule<NoInfer<Name>>[];
};

export type NameOf<C> = C extends Config<infer Name> ? Name : never;

export type Sounds<Name extends string> = {
  /** Starts listening under `root` (default: the document). Returns a function that stops. */
  readonly start: (root?: ParentNode) => () => void;
  readonly play: (name: Name, options?: PlayOptions) => void;
  /** Swaps sounds and rules without losing volume, mute or the unlocked audio context. */
  readonly configure: (config: Pick<Config<Name>, "sounds" | "rules">) => void;
  readonly unlock: () => Promise<boolean>;
  readonly setVolume: (volume: number) => void;
  readonly setMuted: (muted: boolean) => void;
};

/** Infers sound names from `sounds` and checks every rule against them. */
export const defineSounds = <const Name extends string>(config: Config<Name>): Config<Name> => config;

const GESTURES = ["pointerdown", "pointerup", "touchend", "keydown", "click"] as const;

export function createSounds<Name extends string>(config: Config<Name>): Sounds<Name> {
  const engine = createEngine(config);
  let sounds: Readonly<Record<string, Sound>> = config.sounds;
  let rules: readonly Rule<Name>[] = config.rules ?? [];

  const isName = (name: string): name is Name => Object.hasOwn(sounds, name);
  const report = (message: string) => config.onError?.(new Error(message));

  const trigger = (name: Name, options: PlayOptions = {}) => {
    const sound = sounds[name];
    if (sound === undefined) {
      report(`tactone has no sound named "${name}". Known sounds: ${Object.keys(sounds).join(", ")}. Nothing played.`);
      return;
    }
    const pitched = options.pitch === undefined ? sound : Sound.tweak(sound, { pitch: options.pitch });
    engine.play(options.volume === undefined ? pitched : { ...pitched, gain: pitched.gain * Math.max(0, options.volume) });
  };

  const start = (root: ParentNode = document) => {
    const lastPlayed = new Map<Rule<Name> | Trigger, number>();
    let pointer: { readonly x: number; readonly y: number } | null = null;

    const act = (kind: Trigger, target: EventTarget | null, event: Event) => {
      if (!(target instanceof Element) || document.hidden) return;
      const decision: Decision<Name> = Rules.decide(rules, kind, target, event, isName);
      if (decision.kind === "silent") return;
      if (decision.kind === "unknown") {
        report(`tactone found data-sound-${kind}="${decision.name}" but no sound has that name. Known sounds: ${Object.keys(sounds).join(", ")}. Nothing played.`);
        return;
      }
      if (kind === "hover" && event instanceof PointerEvent && event.relatedTarget instanceof Node && decision.element.contains(event.relatedTarget)) return;
      const key = decision.rule ?? kind;
      const gap = decision.rule?.throttle ?? DEFAULT_THROTTLE[kind] ?? 0;
      const now = event.timeStamp;
      if (now - (lastPlayed.get(key) ?? Number.NEGATIVE_INFINITY) < gap) return;
      lastPlayed.set(key, now);
      const pitch = decision.rule?.pitch;
      trigger(decision.name, {
        ...(decision.rule?.volume === undefined ? {} : { volume: decision.rule.volume }),
        ...(pitch === undefined ? {} : { pitch: typeof pitch === "function" ? pitch(decision.element) : pitch }),
      });
    };

    const onPointerOver = (event: Event) => {
      if (!(event instanceof PointerEvent) || event.pointerType !== "mouse") return;
      // pointerover also fires when the DOM swaps under a still mouse, such as a page change. Only real movement counts.
      const moved = pointer !== null && (pointer.x !== event.clientX || pointer.y !== event.clientY);
      pointer = { x: event.clientX, y: event.clientY };
      if (moved) act("hover", event.target, event);
    };
    const onPointerMove = (event: Event) => {
      if (event instanceof PointerEvent) pointer = { x: event.clientX, y: event.clientY };
    };
    const isPrimary = (event: Event) => event instanceof PointerEvent && event.button === 0;
    const onPress = (event: Event) => {
      if (isPrimary(event)) act("press", event.target, event);
    };
    const onRelease = (event: Event) => {
      if (isPrimary(event)) act("release", event.target, event);
    };
    const onClick = (event: Event) => act("click", event.target, event);
    const onChange = (event: Event) => act("change", event.target, event);
    const onInput = (event: Event) => {
      if (event.target instanceof HTMLInputElement && event.target.type === "range") act("slide", event.target, event);
    };
    const onFocus = (event: Event) => {
      if (event.target instanceof Element && event.target.matches(":focus-visible")) act("focus", event.target, event);
    };
    const onKey = (event: Event) => {
      if (event instanceof KeyboardEvent && event.target instanceof Element && Rules.isTextEdit(event, event.target)) act("type", event.target, event);
    };
    const unlock = () => {
      void engine.unlock().then((running) => {
        if (running) for (const gesture of GESTURES) root.removeEventListener(gesture, unlock, true);
      });
    };

    const listeners = [
      ["pointerover", onPointerOver],
      ["pointermove", onPointerMove],
      ["pointerdown", onPress],
      ["pointerup", onRelease],
      ["click", onClick],
      ["change", onChange],
      ["input", onInput],
      ["focusin", onFocus],
      ["keydown", onKey],
    ] as const;

    // Capture phase, so an app's stopPropagation cannot silence a control.
    const capture = { capture: true, passive: true };
    for (const [type, listener] of listeners) root.addEventListener(type, listener, capture);
    for (const gesture of GESTURES) root.addEventListener(gesture, unlock, capture);

    return () => {
      for (const [type, listener] of listeners) root.removeEventListener(type, listener, true);
      for (const gesture of GESTURES) root.removeEventListener(gesture, unlock, true);
    };
  };

  return {
    start,
    play: trigger,
    configure: (next) => {
      sounds = next.sounds;
      rules = next.rules ?? [];
    },
    unlock: engine.unlock,
    setVolume: engine.setVolume,
    setMuted: engine.setMuted,
  };
}
