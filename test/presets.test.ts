import { describe, expect, it } from "vitest";
import { PEAK_LIMIT, PURPOSES, type Purpose, STYLES, type Style, TIER_LOUDNESS, tierOf } from "../src/design.ts";
import { Levels } from "../src/loudness.ts";
import { sets } from "../src/presets.ts";
import { RENDER_RATE, render } from "../src/render.ts";
import { Sound } from "../src/sound.ts";

const cases = STYLES.flatMap((style) => PURPOSES.map((purpose): [Style, Purpose] => [style, purpose]));
const FREQUENT: readonly Purpose[] = ["hover", "type", "slide", "drag"];

const SIZE = 2048;
/** Every fourth bin is enough resolution for these checks, and keeps 684 sounds fast. */
const BIN_STEP = 4;

function spectrum(samples: Float32Array) {
  const bins: { readonly frequency: number; readonly power: number }[] = [];
  for (let bin = BIN_STEP; bin < SIZE / 2; bin += BIN_STEP) {
    let [re, im] = [0, 0];
    for (let index = 0; index < Math.min(SIZE, samples.length); index += 1) {
      const angle = (2 * Math.PI * bin * index) / SIZE;
      const sample = samples[index] ?? 0;
      re += sample * Math.cos(angle);
      im -= sample * Math.sin(angle);
    }
    bins.push({ frequency: (bin * RENDER_RATE) / SIZE, power: re * re + im * im });
  }
  return bins;
}

function energyAbove(samples: Float32Array, cutoff: number) {
  const bins = spectrum(samples);
  const total = bins.reduce((sum, { power }) => sum + power, 0);
  const above = bins.filter(({ frequency }) => frequency > cutoff).reduce((sum, { power }) => sum + power, 0);
  return total === 0 ? 0 : above / total;
}

/** How a sound differs to the ear: where its energy sits, how long it rings, and how noisy and how pitched it is. */
function fingerprint(sound: Sound) {
  const bins = spectrum(render(sound));
  const total = bins.reduce((sum, { power }) => sum + power, 0);
  const noise = sound.layers.filter((layer) => layer.kind === "noise").reduce((sum, layer) => sum + layer.peak, 0);
  const all = sound.layers.reduce((sum, layer) => sum + layer.peak, 0);
  return {
    centroid: bins.reduce((sum, { frequency, power }) => sum + frequency * power, 0) / total,
    length: Sound.duration(sound),
    noisy: noise / all,
    waves: sound.layers
      .flatMap((layer) => (layer.kind === "tone" ? [layer.wave] : []))
      .sort()
      .join(),
    glides: sound.layers.some((layer) => layer.glideTo !== undefined),
  };
}

describe("the palette", () => {
  it("offers 36 styles and 684 sounds", () => {
    expect(STYLES).toHaveLength(36);
    expect(cases).toHaveLength(684);
  });

  it.each(cases)("%s.%s is valid, balanced, comfortable and short", (style, purpose) => {
    const sound = sets[style][purpose];
    const parsed = Sound.parse(JSON.parse(JSON.stringify(sound)));
    expect(parsed.ok ? [] : parsed.problems).toEqual([]);

    const { loudness, peak } = Levels.of(sound);
    expect(peak).toBeLessThanOrEqual(PEAK_LIMIT + 0.1);
    // A sound reaches its tier, unless its peak limit stopped it first.
    const atPeakLimit = peak >= PEAK_LIMIT - 0.1;
    if (!atPeakLimit) expect(Math.abs(loudness - TIER_LOUDNESS[tierOf(purpose)])).toBeLessThanOrEqual(0.2);

    expect(energyAbove(render(sound), 8000)).toBeLessThan(0.1);
    expect(Sound.duration(sound)).toBeLessThan(FREQUENT.includes(purpose) ? 0.3 : 1.4);
  });

  it("keeps frequent sounds under actions in every style", () => {
    for (const style of STYLES) {
      expect(Levels.of(sets[style].hover).loudness).toBeLessThan(Levels.of(sets[style].tap).loudness);
    }
  });

  it("gives every sound in a style its own shape, not one sound at different levels", () => {
    for (const style of STYLES) {
      const shapes = PURPOSES.map((purpose) => JSON.stringify(sets[style][purpose].layers));
      expect(new Set(shapes).size).toBe(PURPOSES.length);
    }
  });

  it("makes every style measurably its own: no two share a character", () => {
    const prints = STYLES.map((style) => ({ style, print: fingerprint(sets[style].tap) }));
    const twins: string[] = [];
    for (const [index, { style, print }] of prints.entries()) {
      for (const other of prints.slice(index + 1)) {
        const nearPitch = Math.abs(Math.log2(print.centroid / other.print.centroid)) < 0.3;
        const nearLength = Math.abs(Math.log2(print.length / other.print.length)) < 0.4;
        const nearTexture = Math.abs(print.noisy - other.print.noisy) < 0.2;
        const sameMaking = print.waves === other.print.waves && print.glides === other.print.glides;
        if (nearPitch && nearLength && nearTexture && sameMaking) twins.push(`${style} / ${other.style}`);
      }
    }
    expect(twins).toEqual([]);
  });
});
