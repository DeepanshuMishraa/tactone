/**
 * The one module that speaks Web Audio. It turns sounds into scheduled nodes on
 * any BaseAudioContext, so tests can render the real graph offline.
 */

import { noiseSamples } from "./render.ts";
import { Layer, type Sound } from "./sound.ts";

const CLIP_KNEE = 0.72;
const CLIP_POINTS = 1025;
const NOISE_SECONDS = 2;
const ROOM_SECONDS = 0.32;
/** The room at full send, relative to the dry signal. */
const ROOM_LEVEL = 0.28;
/** Voices beyond this fade the oldest out, so a burst of events cannot stack up and distort. */
const MAX_VOICES = 12;
const SILENCE_FADE = 0.012;
const INAUDIBLE_PEAK = 1e-5;
/** Seconds kept after a sound's end before its nodes are released. */
const RELEASE_MARGIN = 0.05;

type Voice = { readonly master: GainNode };

export type Bus = {
  /** Schedules the sound to start at `when`, in context time. */
  readonly play: (sound: Sound, when: number) => void;
  /** Fades every sounding voice in a few milliseconds. */
  readonly silence: () => void;
  readonly setLevel: (level: number) => void;
};

/** A soft clip that leaves everything below the knee untouched. */
function clipCurve() {
  const curve = new Float32Array(CLIP_POINTS);
  for (let index = 0; index < CLIP_POINTS; index += 1) {
    const input = (index / (CLIP_POINTS - 1)) * 2 - 1;
    const size = Math.abs(input);
    const headroom = 1 - CLIP_KNEE;
    const shaped = size <= CLIP_KNEE ? size : CLIP_KNEE + headroom * Math.tanh((size - CLIP_KNEE) / headroom);
    curve[index] = Math.sign(input) * shaped;
  }
  return curve;
}

/** A small bright room: seeded noise falling away over a third of a second, decorrelated between ears. */
function roomImpulse(context: BaseAudioContext): AudioBuffer {
  const length = Math.round(ROOM_SECONDS * context.sampleRate);
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const noise = noiseSamples(length, 0x51ed27 + channel * 0x9e37);
    const data = new Float32Array(length);
    for (let index = 0; index < length; index += 1) {
      const progress = index / length;
      data[index] = (noise[index] ?? 0) * 0.001 ** progress * Math.min(1, index / 96);
    }
    buffer.copyToChannel(data, channel);
  }
  return buffer;
}

function noiseBuffer(context: BaseAudioContext): AudioBuffer {
  const length = NOISE_SECONDS * context.sampleRate;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  buffer.copyToChannel(noiseSamples(length), 0);
  return buffer;
}

function schedule(context: BaseAudioContext, noise: AudioBuffer, destination: AudioNode, layer: Layer, when: number): AudioScheduledSourceNode {
  const start = when + (layer.offset ?? 0);
  const attack = Layer.attack(layer);
  const stop = start + attack + layer.decay + Layer.tailFade;

  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(layer.peak, start + attack);
  envelope.gain.exponentialRampToValueAtTime(layer.peak * 0.001, start + attack + layer.decay);
  envelope.gain.linearRampToValueAtTime(0, stop);
  envelope.connect(destination);

  const glide = (parameter: AudioParam) => {
    parameter.setValueAtTime(layer.frequency, start);
    if (layer.glideTo !== undefined) parameter.exponentialRampToValueAtTime(layer.glideTo, start + Layer.glideTime(layer));
  };

  let source: AudioScheduledSourceNode;
  if (layer.kind === "tone") {
    const oscillator = context.createOscillator();
    oscillator.type = layer.wave;
    oscillator.detune.value = layer.detune ?? 0;
    glide(oscillator.frequency);
    oscillator.connect(envelope);
    source = oscillator;
    oscillator.start(start);
  } else {
    const filter = context.createBiquadFilter();
    filter.type = layer.filter;
    filter.Q.value = layer.q ?? 1;
    glide(filter.frequency);
    filter.connect(envelope);
    const buffer = context.createBufferSource();
    buffer.buffer = noise;
    buffer.loop = true;
    buffer.connect(filter);
    source = buffer;
    buffer.start(start, Math.random() * NOISE_SECONDS);
  }
  source.stop(stop);
  return source;
}

/** Builds the shared output chain once for a context: level, then soft clip, then speakers. */
export function createBus(context: BaseAudioContext): Bus {
  const level = context.createGain();
  const clip = context.createWaveShaper();
  clip.curve = clipCurve();
  clip.oversample = "2x";
  level.connect(clip).connect(context.destination);

  const room = context.createConvolver();
  room.buffer = roomImpulse(context);
  const roomReturn = context.createGain();
  roomReturn.gain.value = ROOM_LEVEL;
  room.connect(roomReturn).connect(level);

  const noise = noiseBuffer(context);
  const voices = new Set<Voice>();

  const fade = (voice: Voice) => {
    const now = context.currentTime;
    voice.master.gain.cancelScheduledValues(now);
    voice.master.gain.setValueAtTime(voice.master.gain.value, now);
    voice.master.gain.linearRampToValueAtTime(0, now + SILENCE_FADE);
    voices.delete(voice);
  };

  return {
    play: (sound, when) => {
      // Below this the layer is inaudible, and an exponential ramp to an underflowed 0 would throw.
      const audible = sound.layers.filter((layer) => layer.peak > INAUDIBLE_PEAK);
      const longest = audible.reduce<Layer | null>((best, layer) => (best === null || Layer.end(layer) > Layer.end(best) ? layer : best), null);
      if (longest === null) return;

      const master = context.createGain();
      master.gain.value = sound.gain;
      master.connect(level);
      const send = context.createGain();
      send.gain.value = sound.room ?? 0;
      master.connect(send).connect(room);

      if (voices.size >= MAX_VOICES) {
        const [oldest] = voices;
        if (oldest !== undefined) fade(oldest);
      }
      const voice: Voice = { master };
      voices.add(voice);

      for (const layer of audible) {
        const source = schedule(context, noise, master, layer, when);
        if (layer !== longest) continue;
        source.onended = () => {
          voices.delete(voice);
          setTimeout(() => {
            master.disconnect();
            send.disconnect();
          }, RELEASE_MARGIN * 1000);
        };
      }
    },
    silence: () => {
      for (const voice of [...voices]) fade(voice);
    },
    setLevel: (value) => {
      level.gain.value = value;
    },
  };
}
