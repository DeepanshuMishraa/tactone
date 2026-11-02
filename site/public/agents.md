# Tactone for coding agents

Tactone adds interface sounds to a web app. Sounds are synthesized live with Web Audio: no audio files, no runtime dependencies. This page tells an agent how to add it to an app correctly. Human docs live at `/docs/`.

## Install

```sh
npm i tactone
```

Use the project's own package manager (`pnpm add tactone`, `bun add tactone`, `yarn add tactone`). React 18+ is an optional peer dependency. Node 20+.

## Entry points

| Import            | Contains                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `tactone`         | `defineSounds`, `createSounds`, `defaultRules`, `Sound`, `Levels`, `strike`, `thump`, `breath`, `burst`, `GLASS`, `WOOD`, types |
| `tactone/react`   | `SoundRoot`, `useSounds`                                                                                                        |
| `tactone/presets` | The 36 preset sets, each a named export                                                                                         |

## Add it to a React app

Wrap the app once. Every button, link, checkbox, radio, slider, select and text field under the root then plays the right sound. Do not add `onClick` handlers for sound.

```tsx
import { defaultRules, defineSounds } from "tactone";
import { SoundRoot } from "tactone/react";
import { glass } from "tactone/presets";

const config = defineSounds({ sounds: glass, rules: defaultRules });

export function Root() {
  return (
    <SoundRoot config={config}>
      <App />
    </SoundRoot>
  );
}
```

### Next.js App Router

`defaultRules` contains functions, which React cannot pass from a server component to a client component. Define the config inside a `"use client"` file and render that component from the layout:

```tsx
// app/sounds.tsx
"use client";

import { defaultRules, defineSounds } from "tactone";
import { SoundRoot } from "tactone/react";
import { glass } from "tactone/presets";
import type { ReactNode } from "react";

const config = defineSounds({ sounds: glass, rules: defaultRules });

export function Sounds({ children }: { children: ReactNode }) {
  return <SoundRoot config={config}>{children}</SoundRoot>;
}
```

### Without React

```ts
import { createSounds, defaultRules } from "tactone";
import { glass } from "tactone/presets";

const sounds = createSounds({ sounds: glass, rules: defaultRules });
const stop = sounds.start(); // listens under document; pass a root element to scope it
sounds.play("success");
```

`createSounds` touches no browser API until `start` or `play`, so it is safe during SSR.

## Play a sound from code

```tsx
const sounds = useSounds<typeof config>();
sounds.play("success");
```

The name is type-checked against the config. Use this for outcomes the DOM can't see, such as a request finishing.

## Presets

Pick one preset per app. If the user names no mood, use `glass` or `soft`.

| Mood        | Presets                                                     |
| ----------- | ----------------------------------------------------------- |
| Calm        | `soft`, `warm`, `felt`, `pad`, `dream`, `air`               |
| Natural     | `wood`, `bamboo`, `stone`, `plop`, `bubble`, `rain`         |
| Instruments | `pluck`, `kalimba`, `koto`, `musicbox`, `vibes`, `steel`    |
| Shimmer     | `glass`, `chime`, `ice`, `gong`, `celesta`, `fm`            |
| Digital     | `retro`, `arcade`, `blip`, `scifi`, `synth`, `robot`        |
| Mechanical  | `keys`, `typewriter`, `tactile`, `shutter`, `latch`, `coin` |

Every preset has the same 19 sounds:

| For                          | Sounds                                               |
| ---------------------------- | ---------------------------------------------------- |
| Touching things              | `hover`, `tap`, `select`, `type`, `slide`            |
| Switching and panels         | `toggleOn`, `toggleOff`, `open`, `close`             |
| Moving things                | `navigate`, `back`, `send`, `drag`, `drop`, `remove` |
| Telling people what happened | `success`, `error`, `warning`, `notify`              |

Sets are plain objects, so they mix: `{ ...felt, success: chime.success }`.

## Change a sound

```ts
import { Sound } from "tactone";
import { glass } from "tactone/presets";

const sounds = {
  ...glass,
  tap: Sound.tweak(glass.tap, { pitch: -3, length: 1.4, bright: -0.3, gain: -2, room: 0.4 }),
};
```

`pitch` is semitones, `length` multiplies ring time, `bright` is -1 to 1, `gain` is decibels, `room` is 0 to 1. Every field is optional.

## Rules

`defaultRules` is an ordered list and the first match wins. Put app rules before it, never after:

```ts
const config = defineSounds({
  sounds: glass,
  rules: [{ match: ".danger", on: "click", play: "remove" }, { match: "[role=row]", on: "hover", play: "hover", volume: 0.5 }, ...defaultRules],
});
```

A rule is `{ match, on, play, volume?, pitch?, throttle? }`. `match` is a CSS selector checked with `closest`, so icons inside a button still count. `play` is a sound name or a function `(element, event) => name | null`. A name not in `sounds` is a type error.

Triggers: `click`, `press` (pointer down), `release` (pointer up), `hover` (mouse only), `focus` (`:focus-visible` only), `type` (text edits, never passwords or shortcuts), `change`, `slide` (range inputs).

## Attributes

Attributes beat rules. Use them for one-off exceptions instead of new rules:

```html
<button data-sound="success">Plays success on click</button>
<a data-sound-hover="tap">Plays tap on hover</a>
<button data-sound-click="none">Silent on click, still sounds on hover</button>
<section data-sound="none">Everything in here is silent</section>
```

Bare `data-sound` means click. `data-sound-<trigger>` targets one trigger. Disabled controls and `aria-disabled="true"` are always silent.

## Do and don't

- Do wrap once at the root. Don't add a second `SoundRoot` or call `createSounds` per component.
- Don't play the same sound from both an `onClick` and a rule. If a handler plays its own sound, silence that element with `data-sound-click="none"`.
- Don't store volume or mute inside Tactone. The app owns preferences and applies them with `setVolume(0..1)` and `setMuted(boolean)`.
- Don't add audio files. Build new sounds with `Sound.of` and `strike`/`thump`/`breath`/`burst`, then match their level with `Levels.normalize(sound, -23)`.
- Validate sound JSON from outside the code with `Sound.parse(json)`, which returns `{ ok: true, sound }` or `{ ok: false, problems }`.
- Audio starts on the first user gesture. `await sounds.unlock()` if the result is needed.

## Levels

Presets sit in three loudness tiers: frequent feedback at -30 dB, actions at -23 dB, results at -19 dB. Keep custom sounds in the tier that matches their purpose.

## Tools

- `npx tactone editor` opens a local editor to audition presets, shape sounds and copy the config.
- `npx tactone skill` installs an agent skill to `~/.agents/skills/tactone`.
