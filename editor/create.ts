/**
 * The Create page's model. A new sound is a few parts, each one a layer, shaped
 * in plain terms: what it's made of, how high, how it bends, how long. Levels
 * are handled automatically, so a beginner can't make something painfully loud.
 */

import { Levels } from "../src/loudness.ts";
import { type Layer, Sound, type Tone } from "../src/sound.ts";

export const SOURCES = ["pure", "round", "buzzy", "bright", "air"] as const;
export type Source = (typeof SOURCES)[number];

const WAVE_OF = { pure: "sine", round: "triangle", buzzy: "square", bright: "sawtooth" } as const;

/** Where a new sound's loudness lands, matching the presets' action tier. */
const TARGET_LOUDNESS = -23;
const PEAK_LIMIT = -4;

export const Part = {
  source: (layer: Layer): Source => {
    if (layer.kind === "noise") return "air";
    switch (layer.wave) {
      case "sine":
        return "pure";
      case "triangle":
        return "round";
      case "square":
        return "buzzy";
      case "sawtooth":
        return "bright";
    }
  },

  setSource: (layer: Layer, source: Source): Layer => {
    const shared = {
      frequency: layer.frequency,
      attack: layer.attack,
      decay: layer.decay,
      peak: layer.peak,
      ...(layer.offset === undefined ? {} : { offset: layer.offset }),
      ...(layer.glideTo === undefined ? {} : { glideTo: layer.glideTo }),
      ...(layer.glideTime === undefined ? {} : { glideTime: layer.glideTime }),
    };
    if (source === "air") return { ...shared, kind: "noise", filter: "bandpass", q: layer.kind === "noise" ? (layer.q ?? 2) : 2 };
    return { ...shared, kind: "tone", wave: WAVE_OF[source] };
  },

  /** How far the part bends over its life, in semitones. */
  bend: (layer: Layer) => (layer.glideTo === undefined ? 0 : 12 * Math.log2(layer.glideTo / layer.frequency)),

  setBend: (layer: Layer, semitones: number): Layer => {
    const { glideTo: _glideTo, glideTime: _glideTime, ...rest } = layer;
    if (Math.abs(semitones) < 0.25) return rest;
    return { ...rest, glideTo: Math.min(20_000, Math.max(20, layer.frequency * 2 ** (semitones / 12))) };
  },

  /** Moves the pitch and carries the bend with it, so the part keeps its shape. */
  setPitch: (layer: Layer, frequency: number): Layer => Part.setBend({ ...layer, frequency }, Part.bend(layer)),
} as const;

const tone = (frequency: number, attack: number, decay: number, peak: number): Tone => ({ kind: "tone", wave: "sine", frequency, attack, decay, peak });
const air = (frequency: number, q: number, attack: number, decay: number, peak: number): Layer => ({ kind: "noise", filter: "bandpass", frequency, q, attack, decay, peak });

/** Starting points, named by what they sound like and what they suit. */
export const RECIPES: readonly { readonly name: string; readonly hint: string; readonly parts: readonly Layer[]; readonly room: number }[] = [
  { name: "Note", hint: "One clean tone", parts: [tone(660, 0.003, 0.15, 0.8)], room: 0.1 },
  { name: "Click", hint: "Crisp, for buttons", parts: [air(3000, 3, 0.001, 0.008, 0.8), tone(420, 0.001, 0.03, 0.5)], room: 0 },
  { name: "Pop", hint: "Playful and rising", parts: [{ ...tone(320, 0.002, 0.08, 0.9), glideTo: 880, glideTime: 0.045 }], room: 0.05 },
  { name: "Bell", hint: "Bright, for alerts", parts: [tone(1320, 0.002, 0.5, 0.8), tone(2640, 0.002, 0.25, 0.2), tone(3970, 0.002, 0.12, 0.08)], room: 0.45 },
  { name: "Whoosh", hint: "Air, for panels", parts: [{ ...air(500, 1.2, 0.05, 0.2, 0.9), glideTo: 2600 }], room: 0.2 },
  { name: "Thud", hint: "Heavy, for deleting", parts: [{ ...tone(170, 0.001, 0.12, 0.95), glideTo: 90, glideTime: 0.03 }, air(600, 1, 0.001, 0.015, 0.3)], room: 0.1 },
  { name: "Laser", hint: "A falling zap", parts: [{ ...tone(2400, 0.001, 0.14, 0.7), wave: "square", glideTo: 200, glideTime: 0.12 }], room: 0.25 },
];

/** What a beginner can pick for the main sound, described by how it sounds. */
export const FEELS: readonly { readonly source: Source; readonly name: string; readonly hint: string }[] = [
  { source: "pure", name: "Smooth", hint: "A clean, soft tone" },
  { source: "round", name: "Round", hint: "Slightly fuller and warmer" },
  { source: "buzzy", name: "Buzzy", hint: "Like an old video game" },
  { source: "bright", name: "Sharp", hint: "Bright and edgy, like a synth" },
  { source: "air", name: "Airy", hint: "A breath, with no clear note" },
];

/** Extra sounds to stack on top, each named by what it adds. */
export const ADDITIONS: readonly { readonly name: string; readonly hint: string; readonly layer: Layer }[] = [
  { name: "Click", hint: "A crisp edge at the start", layer: air(3200, 3, 0.001, 0.008, 0.45) },
  { name: "Low thump", hint: "Weight underneath", layer: { ...tone(180, 0.001, 0.07, 0.8), glideTo: 110, glideTime: 0.025 } },
  { name: "High ring", hint: "Sparkle on top", layer: tone(2093, 0.002, 0.22, 0.2) },
  { name: "Whoosh", hint: "Air around it", layer: { ...air(700, 1.3, 0.02, 0.14, 0.45), glideTo: 2200 } },
  { name: "Second note", hint: "Turns it into a chime", layer: { ...tone(990, 0.002, 0.25, 0.6), offset: 0.08 } },
];

/** A random but tasteful new sound: one to three parts, with sensible pitches and short tails. */
export function surprise(random: () => number): { readonly parts: readonly Layer[]; readonly room: number } {
  const between = (low: number, high: number) => low * (high / low) ** random();
  const count = 1 + Math.floor(random() * 3);
  const parts = Array.from({ length: count }, (_, index): Layer => {
    const source = SOURCES[Math.floor(random() * SOURCES.length)] ?? "pure";
    const frequency = between(120, 2400);
    const base = tone(frequency, between(0.001, 0.02), between(0.03, 0.4), 0.3 + random() * 0.6);
    const voiced = Part.setBend(Part.setSource(base, source), random() < 0.4 ? (random() - 0.5) * 24 : 0);
    return index === 0 ? voiced : { ...voiced, offset: random() * 0.12 };
  });
  return { parts, room: random() * 0.5 };
}

/**
 * Turns parts into a finished sound: balanced to the presets' loudness and kept
 * clear of clipping, then adjusted by the user's own volume, in decibels.
 */
export function finish(parts: readonly Layer[], room: number, volume: number): Sound {
  const raw = Sound.of(parts, { room });
  const levels = Levels.of(raw);
  if (levels.peak <= -100) return raw;
  return Sound.tweak(raw, { gain: Math.min(TARGET_LOUDNESS - levels.loudness, PEAK_LIMIT - levels.peak) + volume });
}

/** Moves that apply to the whole sound at once, so a beginner never has to think in layers. */
export type Shape = {
  /** Semitones. */
  readonly pitch: number;
  /** Multiplies every part's ring time. */
  readonly length: number;
  /** -1 to 1. */
  readonly bright: number;
  /** Multiplies every part's fade-in. */
  readonly attack: number;
  /** Semitones added to every part's bend. */
  readonly bend: number;
};

const NEUTRAL_SHAPE: Shape = { pitch: 0, length: 1, bright: 0, attack: 1, bend: 0 };
const MAX_ATTACK = 0.4;

export const Shape = {
  neutral: NEUTRAL_SHAPE,
  apply: (parts: readonly Layer[], shape: Shape): readonly Layer[] =>
    Sound.tweak(Sound.of(parts), { pitch: shape.pitch, length: shape.length, bright: shape.bright }).layers.map((layer) => {
      const bent = shape.bend === 0 ? layer : Part.setBend(layer, Part.bend(layer) + shape.bend);
      return { ...bent, attack: Math.min(MAX_ATTACK, Math.max(0.0005, bent.attack) * shape.attack) };
    }),
} as const;

export type Saved = { readonly name: string; readonly parts: readonly Layer[]; readonly room: number; readonly volume: number };

/** The sound being made. `start` is what Start over returns to. */
export type Draft = Saved & { readonly shape: Shape; readonly start: Pick<Saved, "parts" | "room"> };

export const Draft = {
  of: (name: string, parts: readonly Layer[], room: number, volume = 0): Draft => ({ name, parts, room, volume, shape: NEUTRAL_SHAPE, start: { parts, room } }),
  sound: (draft: Pick<Draft, "parts" | "room" | "volume" | "shape">) => finish(Shape.apply(draft.parts, draft.shape), draft.room, draft.volume),
  /** What Save keeps: the shape baked into the parts, so it reloads exactly as heard. */
  saved: (draft: Draft): Saved => ({ name: draft.name, parts: Shape.apply(draft.parts, draft.shape), room: draft.room, volume: draft.volume }),
  isChanged: (draft: Draft) => draft.shape !== NEUTRAL_SHAPE || draft.parts !== draft.start.parts || draft.room !== draft.start.room || draft.volume !== 0,
} as const;

const STORAGE_KEY = "tactone.sounds";

/**
 * Saved sounds live in this browser only. Storage can be blocked or hold old
 * data, so anything unreadable is skipped rather than breaking the page.
 */
export const Library = {
  load: (): readonly Saved[] => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (!Array.isArray(stored)) return [];
      return stored.flatMap((entry: unknown): Saved[] => {
        if (typeof entry !== "object" || entry === null) return [];
        const name: unknown = Reflect.get(entry, "name");
        const volume: unknown = Reflect.get(entry, "volume");
        const parsed = Sound.parse({ layers: Reflect.get(entry, "parts"), gain: 1, room: Reflect.get(entry, "room") });
        if (!parsed.ok || typeof name !== "string" || typeof volume !== "number") return [];
        return [{ name, parts: parsed.sound.layers, room: parsed.sound.room ?? 0, volume }];
      });
    } catch {
      return [];
    }
  },

  /** Returns whether the browser kept it. */
  store: (sounds: readonly Saved[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sounds));
      return true;
    } catch {
      return false;
    }
  },
} as const;

/** A valid camelCase identifier for the exported code. */
export function identifier(name: string) {
  const words = name
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter((word) => word !== "");
  const joined = words.map((word, index) => (index === 0 ? word.toLowerCase() : `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)).join("");
  if (joined === "") return "mySound";
  return /^[0-9]/.test(joined) ? `sound${joined}` : joined;
}
