/**
 * Named physical gestures built from tones and noise. Reach for these before
 * writing a raw layer: they carry the details that keep a sound from reading
 * as a test tone.
 */

import type { Noise, Tone } from "./sound.ts";

type From = { readonly offset?: number };

/** Modes of a struck object, as [ratio to the fundamental, level]. Inharmonic ratios make it read as a real object. */
export const GLASS = [
  [1, 1],
  [2.76, 0.28],
  [5.4, 0.08],
] as const;
export const WOOD = [
  [1, 1],
  [3.99, 0.18],
] as const;

export type Material = readonly (readonly [number, number])[];

/** Above this the ear tires fast over a working day, so struck modes stop here. */
const MODE_CEILING = 6500;

/** A sine struck sharp that drops to its pitch at once, heard as a soft "tok". */
export const thump = (frequency: number, decay: number, peak: number, more: From = {}): Tone => ({
  kind: "tone",
  wave: "sine",
  frequency: frequency * 1.7,
  glideTo: frequency,
  glideTime: 0.016,
  attack: 0.001,
  decay,
  peak,
  ...more,
});

/** A short burst of band-limited noise: the edge of a click or a contact. */
export const burst = (frequency: number, q: number, decay: number, peak: number, more: From = {}): Noise => ({
  kind: "noise",
  filter: "bandpass",
  frequency,
  q,
  attack: 0.0008,
  decay,
  peak,
  ...more,
});

/** Air moving, as noise that sweeps from one band to another. */
export const breath = (from: number, to: number, decay: number, peak: number, more: From & { readonly attack?: number } = {}): Noise => ({
  kind: "noise",
  filter: "bandpass",
  frequency: from,
  glideTo: to,
  q: 1.3,
  attack: 0.02,
  decay,
  peak,
  ...more,
});

/**
 * A note struck on a material: one sine per mode, with higher modes dying
 * sooner as on a real bar, plus 3 ms of noise for the moment of contact.
 */
export const strike = (frequency: number, decay: number, peak: number, material: Material, more: From = {}): readonly (Tone | Noise)[] => [
  {
    kind: "noise",
    filter: "lowpass",
    frequency: Math.min(frequency * 3, 5000),
    q: -3,
    attack: 0.0008,
    decay: 0.004,
    peak: peak * 0.7,
    ...more,
  },
  ...material
    .filter(([ratio]) => frequency * ratio <= MODE_CEILING)
    .map(
      ([ratio, level]): Tone => ({
        kind: "tone",
        wave: "sine",
        frequency: frequency * ratio,
        attack: 0.002,
        decay: Math.max(0.03, decay / ratio ** 0.7),
        peak: peak * level,
        ...more,
      }),
    ),
];
