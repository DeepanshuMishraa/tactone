/**
 * A sound is plain data: layers of tones and filtered noise, each with an
 * attack and a decay. Nothing here touches Web Audio, so a sound can be saved
 * as JSON, edited, measured offline, and scheduled by the engine.
 */

export type Wave = "sine" | "triangle" | "square" | "sawtooth";
export type Filter = "lowpass" | "highpass" | "bandpass";

type Shape = {
  /** Seconds after the trigger that this layer starts. */
  readonly offset?: number;
  /** Linear fade-in, in seconds. */
  readonly attack: number;
  /** Seconds the layer takes to fall 60 dB once the attack ends. */
  readonly decay: number;
  /** Level at the end of the attack, 0 to 1. */
  readonly peak: number;
  /** Frequency in Hz that the layer glides to. */
  readonly glideTo?: number;
  /** Seconds the glide takes. Defaults to attack + decay. */
  readonly glideTime?: number;
};

export type Tone = Shape & {
  readonly kind: "tone";
  readonly wave: Wave;
  readonly frequency: number;
  /** Detune in cents. */
  readonly detune?: number;
};

export type Noise = Shape & {
  readonly kind: "noise";
  readonly filter: Filter;
  /** The filter's frequency in Hz. */
  readonly frequency: number;
  /** Bandwidth for bandpass; resonance in dB for lowpass and highpass. */
  readonly q?: number;
};

export type Layer = Tone | Noise;

export type Sound = {
  readonly layers: readonly Layer[];
  /** Linear gain over the whole sound. */
  readonly gain: number;
  /** Send to the shared room, 0 to 1. */
  readonly room?: number;
  /** Per-play randomness as fractions of pitch and level. */
  readonly vary?: { readonly pitch: number; readonly level: number };
};

/** Layers shorter than this click, so scheduling and rendering both floor the attack here. */
const MIN_ATTACK = 0.0005;
/** The envelope fades from -60 dB to silence over this many seconds, so a layer never ends on a step. */
const TAIL_FADE = 0.005;
const MIN_FREQUENCY = 20;
const MAX_FREQUENCY = 20_000;

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const hz = (value: number) => clamp(value, MIN_FREQUENCY, MAX_FREQUENCY);

export type Tweak = {
  /** Semitones up or down. */
  readonly pitch?: number;
  /** Multiplies every decay, glide and offset. */
  readonly length?: number;
  /** -1 to 1. Tilts level toward high layers (positive) or low layers (negative). */
  readonly bright?: number;
  /** Decibels added to the whole sound. */
  readonly gain?: number;
  /** Replaces the room send, 0 to 1. */
  readonly room?: number;
};

export type Problem = { readonly path: string; readonly message: string };
export type Parsed = { readonly ok: true; readonly sound: Sound } | { readonly ok: false; readonly problems: readonly Problem[] };

const WAVES: readonly string[] = ["sine", "triangle", "square", "sawtooth"];
const FILTERS: readonly string[] = ["lowpass", "highpass", "bandpass"];

type Reader = {
  readonly path: string;
  readonly problems: Problem[];
  readonly source: object;
};

function read(reader: Reader, key: string): unknown {
  return Reflect.get(reader.source, key);
}

function number(reader: Reader, key: string, low: number, high: number): number | undefined {
  const value = read(reader, key);
  if (typeof value === "number" && Number.isFinite(value) && value >= low && value <= high) return value;
  reader.problems.push({
    path: `${reader.path}${key}`,
    message: `expected a number from ${low} to ${high}, got ${JSON.stringify(value) ?? "nothing"}.`,
  });
  return undefined;
}

function optionalNumber(reader: Reader, key: string, low: number, high: number): number | undefined {
  return read(reader, key) === undefined ? undefined : number(reader, key, low, high);
}

function oneOf(reader: Reader, key: string, options: readonly string[]): void {
  const value = read(reader, key);
  if (typeof value === "string" && options.includes(value)) return;
  reader.problems.push({
    path: `${reader.path}${key}`,
    message: `expected one of ${options.join(", ")}, got ${JSON.stringify(value) ?? "nothing"}.`,
  });
}

function checkLayer(value: unknown, index: number, problems: Problem[]): void {
  const path = `layers[${index}]`;
  if (typeof value !== "object" || value === null) {
    problems.push({ path, message: "expected a layer object." });
    return;
  }
  const reader: Reader = { path: `${path}.`, problems, source: value };
  optionalNumber(reader, "offset", 0, 10);
  number(reader, "attack", 0, 4);
  number(reader, "decay", 0.001, 10);
  number(reader, "peak", 0, 1);
  number(reader, "frequency", MIN_FREQUENCY, MAX_FREQUENCY);
  optionalNumber(reader, "glideTo", MIN_FREQUENCY, MAX_FREQUENCY);
  optionalNumber(reader, "glideTime", 0.001, 10);
  const kind = read(reader, "kind");
  if (kind === "tone") {
    oneOf(reader, "wave", WAVES);
    optionalNumber(reader, "detune", -2400, 2400);
  } else if (kind === "noise") {
    oneOf(reader, "filter", FILTERS);
    optionalNumber(reader, "q", -40, 100);
  } else {
    problems.push({ path: `${path}.kind`, message: `expected "tone" or "noise", got ${JSON.stringify(kind) ?? "nothing"}.` });
  }
}

function isSound(value: object, problems: readonly Problem[]): value is Sound {
  return "layers" in value && problems.length === 0;
}

export const Sound = {
  /** Builds a sound from layers. */
  of: (layers: readonly Layer[], more: Omit<Sound, "layers" | "gain"> & { readonly gain?: number } = {}): Sound => ({
    gain: 1,
    ...more,
    layers,
  }),

  /** Validates untrusted data, such as a saved JSON file. Reports every problem at once. */
  parse: (value: unknown): Parsed => {
    if (typeof value !== "object" || value === null) {
      return { ok: false, problems: [{ path: "", message: "expected a sound object with layers and gain." }] };
    }
    const problems: Problem[] = [];
    const reader: Reader = { path: "", problems, source: value };
    number(reader, "gain", 0, 8);
    optionalNumber(reader, "room", 0, 1);
    const vary = read(reader, "vary");
    if (typeof vary === "object" && vary !== null) {
      const varyReader: Reader = { path: "vary.", problems, source: vary };
      number(varyReader, "pitch", 0, 1);
      number(varyReader, "level", 0, 1);
    } else if (vary !== undefined) {
      problems.push({ path: "vary", message: "expected an object with pitch and level." });
    }
    const layers = read(reader, "layers");
    if (Array.isArray(layers)) {
      layers.forEach((layer: unknown, index) => {
        checkLayer(layer, index, problems);
      });
    } else {
      problems.push({ path: "layers", message: "expected an array of layers." });
    }
    return isSound(value, problems) ? { ok: true, sound: value } : { ok: false, problems };
  },

  /** Returns a reshaped copy. The original is untouched, so one preset can spawn many variations. */
  tweak: (sound: Sound, tweak: Tweak): Sound => {
    const ratio = 2 ** ((tweak.pitch ?? 0) / 12);
    const length = Math.max(0.01, tweak.length ?? 1);
    const bright = clamp(tweak.bright ?? 0, -1, 1);
    const layers = sound.layers.map((layer): Layer => {
      const tilt = clamp((layer.frequency / 1000) ** bright, 0.25, 4);
      return {
        ...layer,
        frequency: hz(layer.frequency * ratio),
        decay: layer.decay * length,
        peak: clamp(layer.peak * tilt, 0, 1),
        ...(layer.offset === undefined ? {} : { offset: layer.offset * length }),
        ...(layer.glideTo === undefined ? {} : { glideTo: hz(layer.glideTo * ratio) }),
        ...(layer.glideTime === undefined ? {} : { glideTime: layer.glideTime * length }),
      };
    });
    return {
      ...sound,
      layers,
      gain: sound.gain * 10 ** ((tweak.gain ?? 0) / 20),
      ...(tweak.room === undefined ? {} : { room: clamp(tweak.room, 0, 1) }),
    };
  },

  /** One play's take: every layer's pitch and level nudged by up to `vary`. `random` returns 0 to 1. */
  humanize: (sound: Sound, random: () => number): Sound => {
    const { vary } = sound;
    if (vary === undefined) return sound;
    const nudge = (amount: number) => 1 + (random() * 2 - 1) * amount;
    const ratio = nudge(vary.pitch);
    return {
      ...sound,
      gain: sound.gain * nudge(vary.level),
      layers: sound.layers.map(
        (layer): Layer => ({
          ...layer,
          frequency: hz(layer.frequency * ratio),
          ...(layer.glideTo === undefined ? {} : { glideTo: hz(layer.glideTo * ratio) }),
        }),
      ),
    };
  },

  /** Seconds from the trigger until the last layer is silent. */
  duration: (sound: Sound): number => sound.layers.reduce((longest, layer) => Math.max(longest, Layer.end(layer)), 0),
} as const;

export const Layer = {
  attack: (layer: Layer): number => Math.max(layer.attack, MIN_ATTACK),
  /** Seconds from the trigger until this layer is silent. */
  end: (layer: Layer): number => (layer.offset ?? 0) + Layer.attack(layer) + layer.decay + TAIL_FADE,
  glideTime: (layer: Layer): number => layer.glideTime ?? Layer.attack(layer) + layer.decay,
  tailFade: TAIL_FADE,
} as const;
