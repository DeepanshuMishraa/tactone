import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { Levels } from "../src/loudness.ts";
import { RENDER_RATE, render } from "../src/render.ts";
import { type Layer, Sound } from "../src/sound.ts";

const finite = (min: number, max: number) => fc.double({ min, max, noNaN: true, noDefaultInfinity: true });

const shape = {
  attack: finite(0, 0.2),
  decay: finite(0.01, 0.6),
  peak: finite(0, 1),
  frequency: finite(40, 12_000),
};

const layer: fc.Arbitrary<Layer> = fc.oneof(
  fc.record({ ...shape, kind: fc.constant("tone" as const), wave: fc.constantFrom("sine" as const, "triangle" as const, "square" as const, "sawtooth" as const) }),
  fc.record({ ...shape, kind: fc.constant("noise" as const), filter: fc.constantFrom("lowpass" as const, "highpass" as const, "bandpass" as const), q: finite(0.1, 12) }),
);

const sound: fc.Arbitrary<Sound> = fc.record({ layers: fc.array(layer, { minLength: 1, maxLength: 4 }), gain: finite(0, 1) });

describe("Sound.parse", () => {
  it("accepts every sound the model can express, including after a JSON round trip", () => {
    fc.assert(
      fc.property(sound, (value) => {
        expect(Sound.parse(JSON.parse(JSON.stringify(value))).ok).toBe(true);
      }),
    );
  });

  it("reports every problem with its path", () => {
    const parsed = Sound.parse({ gain: "loud", layers: [{ kind: "tone", wave: "wobble", frequency: 440, attack: 0, decay: -1, peak: 0.5 }] });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.problems.map((problem) => problem.path)).toEqual(["gain", "layers[0].decay", "layers[0].wave"]);
  });

  it.each([null, 3, "sound", []])("rejects %j", (value) => {
    expect(Sound.parse(value).ok).toBe(false);
  });

  it("never throws on arbitrary input", () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        Sound.parse(value);
      }),
    );
  });
});

describe("Sound.tweak", () => {
  const tone = Sound.of([{ kind: "tone", wave: "sine", frequency: 440, attack: 0.001, decay: 0.2, peak: 0.5 }]);

  it("moves pitch by semitones", () => {
    expect(Sound.tweak(tone, { pitch: 12 }).layers[0]?.frequency).toBeCloseTo(880);
  });

  it("does not change the original", () => {
    const copy = structuredClone(tone);
    Sound.tweak(tone, { pitch: 7, length: 2, gain: -6, bright: 1, room: 0.5 });
    expect(tone).toEqual(copy);
  });

  it("always produces a valid sound", () => {
    const tweak = fc.record({ pitch: finite(-48, 48), length: finite(0.1, 3), bright: finite(-1, 1), gain: finite(-24, 6), room: finite(0, 1) });
    fc.assert(
      fc.property(sound, tweak, (value, change) => {
        const parsed = Sound.parse(Sound.tweak({ ...value, gain: Math.min(value.gain, 1) }, change));
        expect(parsed.ok ? [] : parsed.problems).toEqual([]);
      }),
    );
  });
});

describe("render", () => {
  it("is exactly as long as the sound", () => {
    fc.assert(
      fc.property(sound, (value) => {
        expect(render(value).length).toBe(Math.ceil(Sound.duration(value) * RENDER_RATE));
      }),
      { numRuns: 25 },
    );
  });

  it("starts and ends at silence, so a layer can never click", () => {
    const samples = render(Sound.of([{ kind: "tone", wave: "sine", frequency: 1000, attack: 0.002, decay: 0.1, peak: 1 }]));
    expect(Math.abs(samples[0] ?? 1)).toBeLessThan(0.001);
    expect(Math.abs(samples.at(-1) ?? 1)).toBeLessThan(0.001);
  });

  it("falls 60 dB over the decay", () => {
    const decay = 0.2;
    const samples = render(Sound.of([{ kind: "tone", wave: "sine", frequency: 1000, attack: 0.001, decay, peak: 1 }]));
    const near = (seconds: number) => {
      const start = Math.round(seconds * RENDER_RATE);
      return Math.max(...samples.subarray(start, start + 96).map(Math.abs));
    };
    expect(20 * Math.log10(near(0.001 + decay / 2))).toBeCloseTo(-30, 0);
  });

  it("puts a bandpass noise layer's energy at its frequency", () => {
    const at = (frequency: number) => Levels.of(Sound.of([{ kind: "noise", filter: "bandpass", frequency, q: 8, attack: 0.001, decay: 0.3, peak: 1 }])).peak;
    expect(at(1000)).toBeLessThan(0);
    expect(at(1000)).toBeGreaterThan(-40);
  });
});

describe("Levels", () => {
  it("reads a full-scale 997 Hz tone near -3 dB, as BS.1770 calibrates", () => {
    const samples = new Float32Array(RENDER_RATE);
    for (let index = 0; index < samples.length; index += 1) samples[index] = Math.sin((2 * Math.PI * 997 * index) / RENDER_RATE);
    const { loudness, peak } = Levels.ofSamples(samples);
    expect(loudness).toBeGreaterThan(-3.6);
    expect(loudness).toBeLessThan(-2.4);
    expect(peak).toBeCloseTo(0, 1);
  });

  it("normalize lands on the target", () => {
    const audible = fc.record({
      layers: fc.array(
        fc.record({
          kind: fc.constant("tone" as const),
          wave: fc.constant("sine" as const),
          frequency: fc.integer({ min: 200, max: 6000 }),
          attack: fc.constant(0.002),
          decay: fc.integer({ min: 20, max: 400 }).map((value) => value / 1000),
          peak: fc.integer({ min: 50, max: 1000 }).map((value) => value / 1000),
        }),
        { minLength: 1, maxLength: 4 },
      ),
      gain: fc.integer({ min: 100, max: 1000 }).map((value) => value / 1000),
    });
    fc.assert(
      fc.property(audible, finite(-40, -15), (value, target) => {
        expect(Levels.of(Levels.normalize(value, target)).loudness).toBeCloseTo(target, 0);
      }),
      { numRuns: 25 },
    );
  });

  it("leaves silence alone rather than inventing infinite gain", () => {
    const silent = Sound.of([{ kind: "tone", wave: "sine", frequency: 440, attack: 0.001, decay: 0.1, peak: 0 }]);
    expect(Levels.normalize(silent, -20).gain).toBe(1);
  });
});
