/**
 * 36 complete sets of sounds. Pass one straight to your config, or take a
 * single sound from any of them: `glass.success`, `retro.tap`.
 */

import { design, PURPOSES, type Purpose, STYLES, type Style } from "./design.ts";
import { GAINS } from "./gains.ts";
import type { Sound } from "./sound.ts";

export type SoundSet = Readonly<Record<Purpose, Sound>>;

function set(style: Style): SoundSet {
  return {
    hover: design(style, "hover", GAINS[style].hover),
    tap: design(style, "tap", GAINS[style].tap),
    select: design(style, "select", GAINS[style].select),
    type: design(style, "type", GAINS[style].type),
    slide: design(style, "slide", GAINS[style].slide),
    toggleOn: design(style, "toggleOn", GAINS[style].toggleOn),
    toggleOff: design(style, "toggleOff", GAINS[style].toggleOff),
    open: design(style, "open", GAINS[style].open),
    close: design(style, "close", GAINS[style].close),
    navigate: design(style, "navigate", GAINS[style].navigate),
    back: design(style, "back", GAINS[style].back),
    send: design(style, "send", GAINS[style].send),
    drag: design(style, "drag", GAINS[style].drag),
    drop: design(style, "drop", GAINS[style].drop),
    remove: design(style, "remove", GAINS[style].remove),
    success: design(style, "success", GAINS[style].success),
    error: design(style, "error", GAINS[style].error),
    warning: design(style, "warning", GAINS[style].warning),
    notify: design(style, "notify", GAINS[style].notify),
  };
}

export const soft = /* @__PURE__ */ set("soft");
export const warm = /* @__PURE__ */ set("warm");
export const felt = /* @__PURE__ */ set("felt");
export const pad = /* @__PURE__ */ set("pad");
export const dream = /* @__PURE__ */ set("dream");
export const air = /* @__PURE__ */ set("air");
export const wood = /* @__PURE__ */ set("wood");
export const bamboo = /* @__PURE__ */ set("bamboo");
export const stone = /* @__PURE__ */ set("stone");
export const plop = /* @__PURE__ */ set("plop");
export const bubble = /* @__PURE__ */ set("bubble");
export const rain = /* @__PURE__ */ set("rain");
export const pluck = /* @__PURE__ */ set("pluck");
export const kalimba = /* @__PURE__ */ set("kalimba");
export const koto = /* @__PURE__ */ set("koto");
export const musicbox = /* @__PURE__ */ set("musicbox");
export const vibes = /* @__PURE__ */ set("vibes");
export const steel = /* @__PURE__ */ set("steel");
export const glass = /* @__PURE__ */ set("glass");
export const chime = /* @__PURE__ */ set("chime");
export const ice = /* @__PURE__ */ set("ice");
export const gong = /* @__PURE__ */ set("gong");
export const celesta = /* @__PURE__ */ set("celesta");
export const fm = /* @__PURE__ */ set("fm");
export const retro = /* @__PURE__ */ set("retro");
export const arcade = /* @__PURE__ */ set("arcade");
export const blip = /* @__PURE__ */ set("blip");
export const scifi = /* @__PURE__ */ set("scifi");
export const synth = /* @__PURE__ */ set("synth");
export const robot = /* @__PURE__ */ set("robot");
export const keys = /* @__PURE__ */ set("keys");
export const typewriter = /* @__PURE__ */ set("typewriter");
export const tactile = /* @__PURE__ */ set("tactile");
export const shutter = /* @__PURE__ */ set("shutter");
export const latch = /* @__PURE__ */ set("latch");
export const coin = /* @__PURE__ */ set("coin");

/** Every set by name, for choosing one at runtime. Importing a single set instead keeps your bundle smaller. */
export const sets: Readonly<Record<Style, SoundSet>> = /* @__PURE__ */ Object.freeze({
  soft,
  warm,
  felt,
  pad,
  dream,
  air,
  wood,
  bamboo,
  stone,
  plop,
  bubble,
  rain,
  pluck,
  kalimba,
  koto,
  musicbox,
  vibes,
  steel,
  glass,
  chime,
  ice,
  gong,
  celesta,
  fm,
  retro,
  arcade,
  blip,
  scifi,
  synth,
  robot,
  keys,
  typewriter,
  tactile,
  shutter,
  latch,
  coin,
});

export { PURPOSES, type Purpose, STYLES, type Style };
