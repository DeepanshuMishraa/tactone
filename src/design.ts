/**
 * Every sound is a style playing a purpose. A style says what one note sounds
 * like (glass, a bubble, an 8-bit chip). A purpose says which notes to play and
 * when (a toggle rises, an error falls). Keeping them apart is what makes every
 * style complete and every purpose mean the same thing in any style.
 */

import type { Layer, Sound, Wave } from "./sound.ts";

export const STYLES = [
  // Calm
  "soft",
  "warm",
  "felt",
  "pad",
  "dream",
  "air",
  // Natural
  "wood",
  "bamboo",
  "stone",
  "plop",
  "bubble",
  "rain",
  // Instruments
  "pluck",
  "kalimba",
  "koto",
  "musicbox",
  "vibes",
  "steel",
  // Shimmer
  "glass",
  "chime",
  "ice",
  "gong",
  "celesta",
  "fm",
  // Digital
  "retro",
  "arcade",
  "blip",
  "scifi",
  "synth",
  "robot",
  // Mechanical
  "keys",
  "typewriter",
  "tactile",
  "shutter",
  "latch",
  "coin",
] as const;
export type Style = (typeof STYLES)[number];

export const PURPOSES = [
  "hover",
  "tap",
  "select",
  "type",
  "slide",
  "toggleOn",
  "toggleOff",
  "open",
  "close",
  "navigate",
  "back",
  "send",
  "drag",
  "drop",
  "remove",
  "success",
  "error",
  "warning",
  "notify",
] as const;
export type Purpose = (typeof PURPOSES)[number];

/** One note of a purpose. */
type Note = {
  /** Semitones above the style's root. */
  readonly semi: number;
  /** Milliseconds after the trigger. */
  readonly at: number;
  /** Strength, 0 to 1. */
  readonly vel: number;
  /** Multiplies the style's ring time. */
  readonly len: number;
};

type Tier = "subtle" | "action" | "result";

type Gesture = {
  readonly tier: Tier;
  readonly notes: readonly Note[];
  /** Repeated sounds vary slightly, so they read as a hand rather than a machine. */
  readonly vary?: { readonly pitch: number; readonly level: number };
};

const note = (semi: number, at: number, vel: number, len: number): Note => ({ semi, at, vel, len });

const GESTURES: Readonly<Record<Purpose, Gesture>> = {
  hover: { tier: "subtle", notes: [note(7, 0, 0.5, 0.3)] },
  tap: { tier: "action", notes: [note(0, 0, 1, 0.6)], vary: { pitch: 0.008, level: 0.06 } },
  select: { tier: "action", notes: [note(5, 0, 1, 0.55)] },
  type: { tier: "subtle", notes: [note(-5, 0, 0.8, 0.22)], vary: { pitch: 0.04, level: 0.16 } },
  slide: { tier: "subtle", notes: [note(12, 0, 0.5, 0.16)] },
  toggleOn: { tier: "action", notes: [note(0, 0, 0.8, 0.4), note(7, 34, 1, 0.55)] },
  toggleOff: { tier: "action", notes: [note(7, 0, 0.8, 0.4), note(0, 34, 1, 0.55)] },
  open: { tier: "action", notes: [note(0, 0, 0.7, 0.4), note(4, 42, 0.8, 0.45), note(7, 84, 1, 0.7)] },
  close: { tier: "action", notes: [note(7, 0, 0.7, 0.4), note(4, 42, 0.8, 0.45), note(0, 84, 1, 0.7)] },
  navigate: { tier: "action", notes: [note(2, 0, 0.8, 0.4), note(9, 44, 1, 0.6)] },
  back: { tier: "action", notes: [note(9, 0, 0.8, 0.4), note(2, 44, 1, 0.6)] },
  send: { tier: "action", notes: [note(0, 0, 0.7, 0.35), note(7, 46, 0.85, 0.4), note(14, 92, 1, 0.8)] },
  drag: { tier: "subtle", notes: [note(-2, 0, 0.7, 0.3)] },
  drop: { tier: "action", notes: [note(2, 0, 0.6, 0.3), note(-5, 38, 1, 0.55)] },
  remove: { tier: "action", notes: [note(-5, 0, 0.9, 0.5), note(-12, 58, 1, 0.75)] },
  success: { tier: "result", notes: [note(0, 0, 0.8, 0.8), note(4, 82, 0.85, 0.9), note(7, 164, 1, 1.4)] },
  error: { tier: "result", notes: [note(-2, 0, 0.95, 0.7), note(-5, 112, 1, 0.95)] },
  warning: { tier: "result", notes: [note(3, 0, 0.95, 0.6), note(3, 132, 1, 0.85)] },
  notify: { tier: "result", notes: [note(7, 0, 0.85, 1), note(12, 104, 1, 1.5)] },
};

/** Loudness per tier in decibels. Frequent feedback stays under the action, and results land above it. */
export const TIER_LOUDNESS: Readonly<Record<Tier, number>> = { subtle: -30, action: -23, result: -19 };
/** No preset peaks above this, however quiet its loudness reads. It keeps every sound clear of the soft clip. */
export const PEAK_LIMIT = -4;

export const tierOf = (purpose: Purpose) => GESTURES[purpose].tier;

/** Above this the ear tires quickly, so upper modes that would land here are left out. */
const CEILING = 6500;
const SHORTEST = 0.012;

type Strike = { readonly frequency: number; readonly vel: number; readonly at: number };

type Voice = {
  /** The root note in Hz. */
  readonly root: number;
  /** Seconds a note rings at len 1. */
  readonly ring: number;
  readonly room: number;
  /** Multiplies the gaps between notes. Below 1 is snappier. */
  readonly tempo?: number;
  /** Multiplies the intervals between notes. Below 1 is flatter. */
  readonly spread?: number;
  readonly play: (strike: Strike, ring: number) => readonly Layer[];
};

const timed = (at: number) => (at > 0 ? { offset: at } : {});
const atLeast = (seconds: number, floor = SHORTEST) => Math.max(floor, seconds);

type ToneShape = Partial<Pick<Layer, "glideTo" | "glideTime">> & { readonly detune?: number };

const tone = (wave: Wave, frequency: number, attack: number, decay: number, peak: number, at: number, more: ToneShape = {}): Layer => ({
  kind: "tone",
  wave,
  frequency,
  attack,
  decay: atLeast(decay),
  peak,
  ...timed(at),
  ...more,
});

const hiss = (frequency: number, q: number, attack: number, decay: number, peak: number, at: number, more: Partial<Pick<Layer, "glideTo" | "glideTime">> = {}): Layer => ({
  kind: "noise",
  filter: "bandpass",
  frequency,
  q,
  attack,
  decay: atLeast(decay, 0.003),
  peak,
  ...timed(at),
  ...more,
});

/** One sine per [ratio, level] mode, with higher modes fading sooner, as on a real bar. */
const modes =
  (table: readonly (readonly [number, number])[], attack: number) =>
  ({ frequency, vel, at }: Strike, ring: number): Layer[] =>
    table.filter(([ratio]) => frequency * ratio <= CEILING).map(([ratio, level]) => tone("sine", frequency * ratio, attack, ring / ratio ** 0.7, vel * level, at));

/** A muted touch of noise at the instant of contact. Lowpassed, so it reads as weight rather than a click. */
const touch = (cutoff: number, level: number, { vel, at }: Strike): Layer => ({
  kind: "noise",
  filter: "lowpass",
  frequency: cutoff,
  q: -3,
  attack: 0.001,
  decay: 0.006,
  peak: vel * level,
  ...timed(at),
});

const VOICES: Readonly<Record<Style, Voice>> = {
  // Calm: slow edges and pure tones.
  soft: {
    root: 523.25,
    ring: 0.16,
    room: 0.15,
    play: modes(
      [
        [1, 1],
        [2, 0.05],
      ],
      0.004,
    ),
  },
  warm: {
    root: 220,
    ring: 0.26,
    room: 0.22,
    play: ({ frequency, vel, at }, ring) => [
      tone("sine", frequency, 0.008, ring, vel * 0.6, at, { detune: -5 }),
      tone("sine", frequency, 0.008, ring, vel * 0.6, at, { detune: 5 }),
      tone("triangle", frequency * 2, 0.008, ring * 0.5, vel * 0.07, at),
    ],
  },
  felt: {
    root: 261.63,
    ring: 0.24,
    room: 0.12,
    play: (strike, ring) => [
      touch(800, 0.1, strike),
      ...modes(
        [
          [1, 1],
          [3.99, 0.09],
        ],
        0.004,
      )(strike, ring),
    ],
  },
  pad: {
    root: 311.13,
    ring: 0.38,
    room: 0.45,
    tempo: 1.3,
    play: ({ frequency, vel, at }, ring) => {
      const swell = Math.min(0.035, ring * 0.35);
      return [
        tone("sine", frequency, swell, ring, vel * 0.5, at, { detune: -8 }),
        tone("sine", frequency, swell, ring, vel * 0.5, at, { detune: 8 }),
        tone("triangle", frequency * 1.5, swell, ring * 0.7, vel * 0.1, at),
      ];
    },
  },
  dream: {
    root: 880,
    ring: 0.42,
    room: 0.85,
    tempo: 1.45,
    play: ({ frequency, vel, at }, ring) => [
      tone("sine", frequency, 0.012, ring, vel * 0.55, at, { detune: -11 }),
      tone("sine", frequency, 0.012, ring, vel * 0.55, at, { detune: 11 }),
      tone("sine", frequency * 2, 0.018, ring * 0.8, vel * 0.1, at),
    ],
  },
  air: {
    root: 1400,
    ring: 0.07,
    room: 0.1,
    play: ({ frequency, vel, at }, ring) => [hiss(frequency, 2.4, 0.007, Math.max(0.02, ring), vel, at, { glideTo: frequency * 1.18 })],
  },

  // Natural: things you could hold.
  wood: {
    root: 440,
    ring: 0.075,
    room: 0.06,
    play: (strike, ring) => [
      touch(1700, 0.14, strike),
      tone("sine", strike.frequency * 1.22, 0.001, ring, strike.vel, strike.at, { glideTo: strike.frequency, glideTime: 0.012 }),
      tone("sine", strike.frequency * 2.76, 0.001, ring * 0.4, strike.vel * 0.1, strike.at),
    ],
  },
  bamboo: {
    root: 622.25,
    ring: 0.05,
    room: 0.16,
    play: ({ frequency, vel, at }, ring) => [
      tone("sine", frequency * 1.06, 0.001, ring, vel, at, { glideTo: frequency, glideTime: 0.02 }),
      tone("sine", frequency * 2.32, 0.001, ring * 0.55, vel * 0.32, at),
      hiss(frequency * 1.5, 5, 0.001, 0.006, vel * 0.14, at),
    ],
  },
  stone: {
    root: 116.54,
    ring: 0.1,
    room: 0.18,
    spread: 0.7,
    play: ({ frequency, vel, at }, ring) => [
      tone("sine", frequency * 1.45, 0.001, ring, vel, at, { glideTo: frequency, glideTime: 0.022 }),
      tone("sine", frequency * 2.24, 0.001, ring * 0.6, vel * 0.4, at),
      { kind: "noise", filter: "lowpass", frequency: 620, q: -3, attack: 0.001, decay: 0.022, peak: vel * 0.55, ...timed(at) },
    ],
  },
  plop: {
    root: 293.66,
    ring: 0.09,
    room: 0.12,
    play: ({ frequency, vel, at }, ring) => [tone("sine", frequency * 1.6, 0.002, ring, vel, at, { glideTo: frequency, glideTime: 0.028 })],
  },
  bubble: {
    root: 392,
    ring: 0.1,
    room: 0.1,
    play: ({ frequency, vel, at }, ring) => [tone("sine", frequency * 0.72, 0.003, ring, vel, at, { glideTo: frequency * 1.2, glideTime: Math.max(0.02, ring * 0.55) })],
  },
  rain: {
    root: 2217.46,
    ring: 0.028,
    room: 0.32,
    tempo: 0.7,
    play: ({ frequency, vel, at }, ring) => [
      tone("sine", frequency * 0.88, 0.0015, ring, vel, at, { glideTo: frequency * 1.22, glideTime: Math.max(0.01, ring * 0.7) }),
      hiss(frequency * 0.55, 1.1, 0.001, 0.004, vel * 0.08, at),
    ],
  },

  // Instruments: recognizably played.
  pluck: {
    root: 329.63,
    ring: 0.22,
    room: 0.15,
    play: ({ frequency, vel, at }, ring) => [tone("triangle", frequency, 0.002, ring, vel * 0.8, at), tone("sine", frequency * 2, 0.002, ring * 0.45, vel * 0.22, at)],
  },
  kalimba: {
    root: 587.33,
    ring: 0.3,
    room: 0.18,
    play: ({ frequency, vel, at }, ring) => [
      tone("sine", frequency, 0.001, ring, vel, at),
      tone("sine", frequency * 5.43, 0.001, Math.min(ring * 0.1, 0.02), vel * 0.22, at),
      tone("sine", frequency * 2, 0.001, ring * 0.35, vel * 0.07, at),
    ],
  },
  koto: {
    root: 392,
    ring: 0.34,
    room: 0.16,
    play: ({ frequency, vel, at }, ring) => [
      tone("triangle", frequency * 1.035, 0.001, ring, vel * 0.7, at, { glideTo: frequency, glideTime: 0.03 }),
      tone("sawtooth", frequency, 0.001, ring * 0.22, vel * 0.09, at),
      tone("sine", frequency * 3, 0.001, ring * 0.3, vel * 0.11, at),
    ],
  },
  musicbox: {
    root: 1661.22,
    ring: 0.36,
    room: 0.22,
    tempo: 0.85,
    play: modes(
      [
        [1, 1],
        [3.02, 0.22],
        [5.2, 0.05],
      ],
      0.001,
    ),
  },
  vibes: {
    root: 493.88,
    ring: 0.62,
    room: 0.35,
    play: ({ frequency, vel, at }, ring) => [
      tone("sine", frequency, 0.003, ring, vel * 0.55, at, { detune: -3 }),
      tone("sine", frequency, 0.003, ring, vel * 0.55, at, { detune: 3 }),
      tone("sine", frequency * 4, 0.002, ring * 0.3, vel * 0.1, at),
    ],
  },
  steel: {
    root: 349.23,
    ring: 0.5,
    room: 0.3,
    play: modes(
      [
        [1, 1],
        [2, 0.42],
        [3.02, 0.12],
      ],
      0.003,
    ),
  },

  // Shimmer: glass, bells and metal in the air.
  glass: {
    root: 1046.5,
    ring: 0.3,
    room: 0.3,
    play: modes(
      [
        [1, 1],
        [2.76, 0.16],
        [5.4, 0.04],
      ],
      0.002,
    ),
  },
  chime: {
    root: 1318.5,
    ring: 0.5,
    room: 0.45,
    play: modes(
      [
        [1, 1],
        [2, 0.2],
        [3.01, 0.07],
        [4.2, 0.03],
      ],
      0.002,
    ),
  },
  ice: {
    root: 2793.83,
    ring: 0.1,
    room: 0.4,
    tempo: 0.75,
    play: modes(
      [
        [1, 1],
        [1.51, 0.28],
      ],
      0.001,
    ),
  },
  gong: {
    root: 155.56,
    ring: 0.7,
    room: 0.55,
    tempo: 1.25,
    play: modes(
      [
        [1, 1],
        [1.48, 0.55],
        [2.13, 0.38],
        [3.11, 0.22],
        [4.7, 0.1],
      ],
      0.006,
    ),
  },
  celesta: {
    root: 987.77,
    ring: 0.2,
    room: 0.2,
    play: modes(
      [
        [1, 1],
        [4, 0.34],
      ],
      0.001,
    ),
  },
  fm: {
    root: 830.61,
    ring: 0.62,
    room: 0.2,
    play: modes(
      [
        [1, 1],
        [3.5, 0.5],
        [7.01, 0.2],
      ],
      0.001,
    ),
  },

  // Digital: things that were never physical.
  retro: {
    root: 523.25,
    ring: 0.08,
    room: 0,
    tempo: 0.8,
    play: ({ frequency, vel, at }, ring) => [tone("square", frequency, 0.001, ring, vel * 0.4, at)],
  },
  arcade: {
    root: 349.23,
    ring: 0.1,
    room: 0.05,
    tempo: 0.6,
    spread: 1.5,
    play: ({ frequency, vel, at }, ring) => [tone("square", frequency * 0.75, 0.001, ring, vel * 0.4, at, { glideTo: frequency * 1.5, glideTime: Math.max(0.015, ring * 0.7) })],
  },
  blip: {
    root: 1760,
    ring: 0.034,
    room: 0.06,
    tempo: 0.6,
    play: ({ frequency, vel, at }, ring) => [tone("sine", frequency, 0.001, ring, vel, at)],
  },
  scifi: {
    root: 370,
    ring: 0.13,
    room: 0.4,
    spread: 1.25,
    play: ({ frequency, vel, at }, ring) => [
      tone("sine", frequency * 3.2, 0.001, ring, vel, at, { glideTo: frequency, glideTime: Math.max(0.02, ring * 0.55) }),
      tone("triangle", frequency * 1.6, 0.001, ring * 0.7, vel * 0.18, at, { glideTo: frequency * 0.5, glideTime: Math.max(0.02, ring * 0.55) }),
    ],
  },
  synth: {
    root: 196,
    ring: 0.17,
    room: 0.24,
    play: ({ frequency, vel, at }, ring) => [
      tone("sawtooth", frequency, 0.005, ring, vel * 0.32, at, { detune: -9 }),
      tone("sawtooth", frequency, 0.005, ring, vel * 0.32, at, { detune: 9 }),
      tone("sine", frequency / 2, 0.005, ring, vel * 0.3, at),
    ],
  },
  robot: {
    root: 138.59,
    ring: 0.085,
    room: 0.08,
    tempo: 0.9,
    spread: 0.35,
    play: ({ frequency, vel, at }, ring) => [tone("square", frequency, 0.001, ring, vel * 0.32, at), tone("sine", frequency * 7.07, 0.001, ring * 0.8, vel * 0.3, at)],
  },

  // Mechanical: parts that move.
  keys: {
    root: 190,
    ring: 0.05,
    room: 0.04,
    play: ({ frequency, vel, at }, ring) => [
      hiss(frequency * 1.7, 1.5, 0.001, Math.max(0.014, ring * 0.7), vel, at),
      tone("sine", frequency, 0.002, Math.max(0.018, ring), vel * 0.55, at),
      hiss(2300, 2, 0.001, 0.004, vel * 0.08, at),
    ],
  },
  typewriter: {
    root: 2100,
    ring: 0.016,
    room: 0.05,
    tempo: 0.85,
    spread: 0.25,
    play: ({ frequency, vel, at }, ring) => [
      hiss(frequency, 1, 0.0008, ring * 0.5, vel, at),
      hiss(880, 5, 0.001, ring, vel * 0.7, at),
      tone("sine", 240, 0.001, ring * 1.4, vel * 0.22, at),
    ],
  },
  tactile: {
    root: 3200,
    ring: 0.009,
    room: 0.02,
    tempo: 0.55,
    spread: 0.4,
    play: ({ frequency, vel, at }, ring) => [hiss(frequency, 3.2, 0.0006, ring, vel, at), tone("sine", frequency / 7, 0.001, ring * 2.2, vel * 0.3, at)],
  },
  shutter: {
    root: 1500,
    ring: 0.012,
    room: 0.06,
    tempo: 1.35,
    spread: 0.3,
    play: ({ frequency, vel, at }, ring) => [hiss(frequency, 1.7, 0.0008, ring, vel, at), hiss(frequency * 0.62, 2.2, 0.0008, ring * 1.3, vel * 0.8, at + 0.038)],
  },
  latch: {
    root: 261.63,
    ring: 0.03,
    room: 0.08,
    spread: 0.5,
    play: ({ frequency, vel, at }, ring) => [
      tone("sine", frequency * 1.8, 0.001, ring, vel * 0.7, at, { glideTo: frequency, glideTime: 0.01 }),
      hiss(frequency * 9, 9, 0.0008, ring * 0.9, vel * 0.9, at),
      hiss(frequency * 14, 12, 0.0008, ring * 0.55, vel * 0.5, at),
    ],
  },
  coin: {
    root: 987.77,
    ring: 0.1,
    room: 0.08,
    tempo: 0.8,
    play: ({ frequency, vel, at }, ring) => [
      tone("square", frequency, 0.001, Math.min(ring, 0.05), vel * 0.26, at),
      tone("square", frequency * 1.335, 0.001, ring * 1.6, vel * 0.3, at + 0.04),
    ],
  },
};

/** Builds one style's take on one purpose, at the given gain. */
export function design(style: Style, purpose: Purpose, gain = 1): Sound {
  const voice = VOICES[style];
  const gesture = GESTURES[purpose];
  const tempo = voice.tempo ?? 1;
  const spread = voice.spread ?? 1;
  const layers = gesture.notes.flatMap((played) =>
    voice.play({ frequency: voice.root * 2 ** ((played.semi * spread) / 12), vel: played.vel, at: (played.at * tempo) / 1000 }, voice.ring * played.len),
  );
  return {
    layers,
    gain,
    room: gesture.tier === "result" ? Math.min(1, voice.room * 1.5) : voice.room,
    ...(gesture.vary === undefined ? {} : { vary: gesture.vary }),
  };
}
