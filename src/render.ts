/**
 * Renders a sound to samples without Web Audio, following the Web Audio spec's
 * filter and envelope math. It powers loudness checks in tests, the editor's
 * waveform, and WAV export. The room is left out: it is faint and shared.
 */

import { Layer, type Noise, Sound, type Tone, type Wave } from "./sound.ts";

export const RENDER_RATE = 48_000;
const TAU = Math.PI * 2;
/** Glide updates per second for the noise filter. Web Audio recalculates per 128-sample block. */
const FILTER_BLOCK = 128;

/** The seeded noise both the renderer and the engine loop from, so a noise layer sounds the same in each. */
export function noiseSamples(length: number, seed = 0x2f6e2b1) {
  const samples = new Float32Array(length);
  let state = seed;
  for (let index = 0; index < length; index += 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    samples[index] = (state | 0) / 0x80000000;
  }
  return samples;
}

function envelope(layer: Layer, time: number): number {
  const attack = Layer.attack(layer);
  if (time < attack) return (layer.peak * time) / attack;
  const falling = time - attack;
  if (falling < layer.decay) return layer.peak * 0.001 ** (falling / layer.decay);
  const fading = falling - layer.decay;
  return fading < Layer.tailFade ? layer.peak * 0.001 * (1 - fading / Layer.tailFade) : 0;
}

function frequencyAt(layer: Layer, time: number): number {
  if (layer.glideTo === undefined) return layer.frequency;
  const glide = Layer.glideTime(layer);
  if (time >= glide) return layer.glideTo;
  return layer.frequency * (layer.glideTo / layer.frequency) ** (time / glide);
}

function oscillator(wave: Wave, phase: number): number {
  switch (wave) {
    case "sine":
      return Math.sin(TAU * phase);
    case "square":
      return phase < 0.5 ? 1 : -1;
    case "sawtooth":
      return 2 * phase - 1;
    case "triangle":
      return 1 - 4 * Math.abs(phase - 0.5);
  }
}

function addTone(out: Float32Array, layer: Tone, gain: number): void {
  const first = Math.round((layer.offset ?? 0) * RENDER_RATE);
  const count = Math.ceil((Layer.end(layer) - (layer.offset ?? 0)) * RENDER_RATE);
  const detune = 2 ** ((layer.detune ?? 0) / 1200);
  let phase = 0;
  for (let index = 0; index < count && first + index < out.length; index += 1) {
    const time = index / RENDER_RATE;
    const sample = oscillator(layer.wave, phase) * envelope(layer, time) * gain;
    out[first + index] = (out[first + index] ?? 0) + sample;
    phase = (phase + (frequencyAt(layer, time) * detune) / RENDER_RATE) % 1;
  }
}

type Biquad = { b0: number; b1: number; b2: number; a1: number; a2: number };

function biquad(layer: Noise, frequency: number): Biquad {
  const w0 = (TAU * Math.min(frequency, RENDER_RATE / 2 - 1)) / RENDER_RATE;
  const cos = Math.cos(w0);
  const sin = Math.sin(w0);
  const q = layer.q ?? 1;
  switch (layer.filter) {
    case "bandpass": {
      const alpha = sin / (2 * Math.max(q, 0.0001));
      const a0 = 1 + alpha;
      return { b0: alpha / a0, b1: 0, b2: -alpha / a0, a1: (-2 * cos) / a0, a2: (1 - alpha) / a0 };
    }
    case "lowpass": {
      const alpha = sin / (2 * 10 ** (q / 20));
      const a0 = 1 + alpha;
      const edge = (1 - cos) / 2 / a0;
      return { b0: edge, b1: (1 - cos) / a0, b2: edge, a1: (-2 * cos) / a0, a2: (1 - alpha) / a0 };
    }
    case "highpass": {
      const alpha = sin / (2 * 10 ** (q / 20));
      const a0 = 1 + alpha;
      const edge = (1 + cos) / 2 / a0;
      return { b0: edge, b1: -(1 + cos) / a0, b2: edge, a1: (-2 * cos) / a0, a2: (1 - alpha) / a0 };
    }
  }
}

function addNoise(out: Float32Array, layer: Noise, gain: number, noise: Float32Array): void {
  const first = Math.round((layer.offset ?? 0) * RENDER_RATE);
  const count = Math.ceil((Layer.end(layer) - (layer.offset ?? 0)) * RENDER_RATE);
  let filter = biquad(layer, layer.frequency);
  let [x1, x2, y1, y2] = [0, 0, 0, 0];
  for (let index = 0; index < count && first + index < out.length; index += 1) {
    const time = index / RENDER_RATE;
    if (layer.glideTo !== undefined && index % FILTER_BLOCK === 0) filter = biquad(layer, frequencyAt(layer, time));
    const x0 = noise[index % noise.length] ?? 0;
    const y0 = filter.b0 * x0 + filter.b1 * x1 + filter.b2 * x2 - filter.a1 * y1 - filter.a2 * y2;
    [x2, x1, y2, y1] = [x1, x0, y1, y0];
    out[first + index] = (out[first + index] ?? 0) + y0 * envelope(layer, time) * gain;
  }
}

/** Renders the sound's dry signal at RENDER_RATE. */
export function render(sound: Sound): Float32Array {
  const out = new Float32Array(Math.ceil(Sound.duration(sound) * RENDER_RATE));
  const noise = noiseSamples(RENDER_RATE);
  for (const layer of sound.layers) {
    if (layer.peak === 0) continue;
    if (layer.kind === "tone") addTone(out, layer, sound.gain);
    else addNoise(out, layer, sound.gain, noise);
  }
  return out;
}
