/**
 * How loud a sound is to a person, not just how high its peak goes. Custom
 * sounds drift out of balance without this. It uses the K-weighting from ITU-R
 * BS.1770, read over a 100 ms window instead of the standard's 400 ms, because
 * interface sounds are often shorter than 400 ms and the ear still ranks them
 * by their loudest instant.
 */

import { RENDER_RATE, render } from "./render.ts";
import { Sound } from "./sound.ts";

const WINDOW_SECONDS = 0.1;
const HOP_SECONDS = 0.01;
const SILENCE_DB = -120;

/** BS.1770 stage 1 (head shelf) and stage 2 (RLB high-pass) at 48 kHz. */
const STAGES = [
  { b: [1.53512485958697, -2.69169618940638, 1.19839281085285], a: [-1.69065929318241, 0.73248077421585] },
  { b: [1, -2, 1], a: [-1.99004745483398, 0.99007225036621] },
] as const;

function weigh(samples: Float32Array): Float64Array {
  let input: ArrayLike<number> = samples;
  let output = new Float64Array(samples.length);
  for (const { b, a } of STAGES) {
    output = new Float64Array(samples.length);
    let [x1, x2, y1, y2] = [0, 0, 0, 0];
    for (let index = 0; index < samples.length; index += 1) {
      const x0 = input[index] ?? 0;
      const y0 = b[0] * x0 + b[1] * x1 + b[2] * x2 - a[0] * y1 - a[1] * y2;
      [x2, x1, y2, y1] = [x1, x0, y1, y0];
      output[index] = y0;
    }
    input = output;
  }
  return output;
}

const decibels = (linear: number) => (linear > 0 ? Math.max(SILENCE_DB, 20 * Math.log10(linear)) : SILENCE_DB);

export type Levels = {
  /** Highest absolute sample, in dBFS. */
  readonly peak: number;
  /** K-weighted loudness of the loudest 100 ms, in LUFS-style decibels. */
  readonly loudness: number;
};

export const Levels = {
  ofSamples: (samples: Float32Array): Levels => {
    let peak = 0;
    for (const sample of samples) peak = Math.max(peak, Math.abs(sample));

    const weighted = weigh(samples);
    const size = Math.round(WINDOW_SECONDS * RENDER_RATE);
    const hop = Math.round(HOP_SECONDS * RENDER_RATE);
    let energy = 0;
    let loudest = 0;
    for (let index = 0; index < weighted.length + size; index += 1) {
      const entering = weighted[index] ?? 0;
      const leaving = weighted[index - size] ?? 0;
      energy += entering * entering - leaving * leaving;
      if (index % hop === 0) loudest = Math.max(loudest, energy);
    }
    const loudness = loudest > 0 ? Math.max(SILENCE_DB, -0.691 + 10 * Math.log10(loudest / size)) : SILENCE_DB;
    return { peak: decibels(peak), loudness };
  },

  of: (sound: Sound): Levels => Levels.ofSamples(render(sound)),

  /** Returns the sound with its gain set so it measures `target` decibels. A silent sound comes back unchanged. */
  normalize: (sound: Sound, target: number): Sound => {
    const { loudness } = Levels.of(sound);
    if (loudness <= SILENCE_DB) return sound;
    return Sound.tweak(sound, { gain: target - loudness });
  },
} as const;
