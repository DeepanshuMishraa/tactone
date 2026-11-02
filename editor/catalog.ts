/** The presets grouped by mood, and the sounds grouped by what they are for. The editor and the site share them. */

import type { Purpose, Style } from "../src/presets.ts";

export const MOODS: readonly { readonly title: string; readonly styles: readonly { readonly id: Style; readonly name: string; readonly hint: string }[] }[] = [
  {
    title: "Calm",
    styles: [
      { id: "soft", name: "Soft", hint: "Pure and rounded. Fits anything." },
      { id: "warm", name: "Warm", hint: "Low, gentle and close." },
      { id: "felt", name: "Felt", hint: "A marimba under a felt mallet." },
      { id: "pad", name: "Pad", hint: "A slow swell that fades in." },
      { id: "dream", name: "Dream", hint: "High, hazy and far away." },
      { id: "air", name: "Air", hint: "A soft breath, barely a note." },
    ],
  },
  {
    title: "Natural",
    styles: [
      { id: "wood", name: "Wood", hint: "A short, dry knock." },
      { id: "bamboo", name: "Bamboo", hint: "Hollow and woody." },
      { id: "stone", name: "Stone", hint: "Heavy and low." },
      { id: "plop", name: "Water", hint: "Round drops that fall into place." },
      { id: "bubble", name: "Bubble", hint: "Playful notes that rise." },
      { id: "rain", name: "Rain", hint: "Tiny, quick droplets." },
    ],
  },
  {
    title: "Instruments",
    styles: [
      { id: "pluck", name: "Pluck", hint: "A rounded plucked string." },
      { id: "kalimba", name: "Kalimba", hint: "A thumb piano with a metal tine." },
      { id: "koto", name: "Koto", hint: "A string that bends into its note." },
      { id: "musicbox", name: "Music box", hint: "Tiny, delicate and high." },
      { id: "vibes", name: "Vibes", hint: "A vibraphone that hangs in the air." },
      { id: "steel", name: "Steel drum", hint: "Round, with a long ring." },
    ],
  },
  {
    title: "Shimmer",
    styles: [
      { id: "glass", name: "Glass", hint: "Light, bright and airy." },
      { id: "chime", name: "Chime", hint: "A small bell with a long tail." },
      { id: "ice", name: "Ice", hint: "Very high, cold and brief." },
      { id: "gong", name: "Gong", hint: "Deep metal that keeps ringing." },
      { id: "celesta", name: "Celesta", hint: "Sweet and bell-like." },
      { id: "fm", name: "FM", hint: "An 80s electric piano." },
    ],
  },
  {
    title: "Digital",
    styles: [
      { id: "retro", name: "Retro", hint: "An 8-bit chip from an old console." },
      { id: "arcade", name: "Arcade", hint: "Square waves that leap upward." },
      { id: "blip", name: "Blip", hint: "One clean, tiny beep." },
      { id: "scifi", name: "Sci-fi", hint: "Falling sweeps from a spaceship." },
      { id: "synth", name: "Synth", hint: "Thick, detuned and modern." },
      { id: "robot", name: "Robot", hint: "A flat, metallic buzz." },
    ],
  },
  {
    title: "Mechanical",
    styles: [
      { id: "keys", name: "Keyboard", hint: "A muted keyboard thock." },
      { id: "typewriter", name: "Typewriter", hint: "Sharp strikes on paper." },
      { id: "tactile", name: "Switch", hint: "A tiny, crisp switch click." },
      { id: "shutter", name: "Shutter", hint: "A camera's double click." },
      { id: "latch", name: "Latch", hint: "Small metal parts locking." },
      { id: "coin", name: "Coin", hint: "A bright, two-note pickup." },
    ],
  },
];

export const SOUNDS: readonly { readonly title: string; readonly items: readonly { readonly id: Purpose; readonly name: string }[] }[] = [
  {
    title: "Touch",
    items: [
      { id: "tap", name: "Tap" },
      { id: "hover", name: "Hover" },
      { id: "select", name: "Select" },
      { id: "type", name: "Type" },
      { id: "slide", name: "Slide" },
    ],
  },
  {
    title: "Switch",
    items: [
      { id: "toggleOn", name: "Toggle on" },
      { id: "toggleOff", name: "Toggle off" },
      { id: "open", name: "Open" },
      { id: "close", name: "Close" },
    ],
  },
  {
    title: "Move",
    items: [
      { id: "navigate", name: "Navigate" },
      { id: "back", name: "Back" },
      { id: "send", name: "Send" },
      { id: "drag", name: "Drag" },
      { id: "drop", name: "Drop" },
      { id: "remove", name: "Remove" },
    ],
  },
  {
    title: "Result",
    items: [
      { id: "success", name: "Success" },
      { id: "error", name: "Error" },
      { id: "warning", name: "Warning" },
      { id: "notify", name: "Notify" },
    ],
  },
];

export const PRESET_LIST = MOODS.flatMap((mood) => mood.styles);
export const SOUND_LIST = SOUNDS.flatMap((group) => group.items);
