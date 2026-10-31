/** What leaves the editor: the code to paste, and a WAV. */

import { RENDER_RATE, render } from "../src/render.ts";
import type { Sound, Tweak } from "../src/sound.ts";

const NEUTRAL: Required<Omit<Tweak, "room">> = { pitch: 0, length: 1, bright: 0, gain: 0 };

/** The tweak as source text, leaving out anything still at its starting value. */
function tweakText(tweak: Tweak, room: number) {
  const parts = [
    tweak.pitch !== undefined && tweak.pitch !== NEUTRAL.pitch && `pitch: ${tweak.pitch.toFixed(1)}`,
    tweak.length !== undefined && tweak.length !== NEUTRAL.length && `length: ${tweak.length.toFixed(2)}`,
    tweak.bright !== undefined && tweak.bright !== NEUTRAL.bright && `bright: ${tweak.bright.toFixed(2)}`,
    tweak.gain !== undefined && tweak.gain !== NEUTRAL.gain && `gain: ${tweak.gain.toFixed(1)}`,
    tweak.room !== undefined && tweak.room !== room && `room: ${tweak.room.toFixed(2)}`,
  ].filter((part) => typeof part === "string");
  return parts.join(", ");
}

export type Change = { readonly purpose: string; readonly tweak: Tweak; readonly room: number };

const round = (value: unknown): unknown => {
  if (typeof value === "number") return Number(value.toPrecision(4));
  if (Array.isArray(value)) return value.map(round);
  if (typeof value === "object" && value !== null) return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, round(inner)]));
  return value;
};

/** Valid TypeScript, with quoted keys removed. */
const literal = (value: unknown) => JSON.stringify(round(value), null, 2).replace(/"(\w+)":/g, "$1:");

export const Code = {
  /** A complete, ready-to-paste config for a preset and whatever was changed in it. */
  config: (style: string, changes: readonly Change[]) => {
    const lines = changes.flatMap(({ purpose, tweak, room }) => {
      const text = tweakText(tweak, room);
      return text === "" ? [] : [`    ${purpose}: Sound.tweak(${style}.${purpose}, { ${text} }),`];
    });
    const imports = lines.length === 0 ? "defaultRules, defineSounds" : "defaultRules, defineSounds, Sound";
    const sounds = lines.length === 0 ? `  sounds: ${style},` : `  sounds: {\n    ...${style},\n${lines.join("\n")}\n  },`;
    return `import { ${imports} } from "foley";
import { ${style} } from "foley/presets";

export const config = defineSounds({
${sounds}
  rules: defaultRules,
});

// Then wrap your app once, at the root:
// <SoundRoot config={config}><App /></SoundRoot>
`;
  },

  /** A sound made from scratch, plus how to use it. */
  sound: (name: string, sound: Sound) => `import type { Sound } from "foley";

export const ${name}: Sound = ${literal(sound)};

// Use it alongside any preset:
// defineSounds({ sounds: { ...glass, tap: ${name} }, rules: defaultRules })
`,

  /** 16-bit mono PCM. */
  wav: (sound: Sound) => {
    const samples = render(sound);
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const text = (at: number, value: string) => {
      for (let index = 0; index < value.length; index += 1) view.setUint8(at + index, value.charCodeAt(index));
    };
    text(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    text(8, "WAVEfmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, RENDER_RATE, true);
    view.setUint32(28, RENDER_RATE * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    text(36, "data");
    view.setUint32(40, samples.length * 2, true);
    samples.forEach((sample, index) => {
      view.setInt16(44 + index * 2, Math.max(-1, Math.min(1, sample)) * 0x7fff, true);
    });
    return new Blob([buffer], { type: "audio/wav" });
  },
} as const;
