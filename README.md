# Foley

Sounds for your interface. Pick a preset, wrap your app, done. 36 presets and 684 level-matched sounds, synthesized live, with no audio files and no runtime dependencies.

```tsx
import { defaultRules, defineSounds } from "foley";
import { SoundRoot } from "foley/react";
import { glass } from "foley/presets";

const config = defineSounds({ sounds: glass, rules: defaultRules });

<SoundRoot config={config}>
  <App />
</SoundRoot>;
```

Every button, link, checkbox, slider, select and text field now sounds right. To audition all of them, run `pnpm editor` in this repo, or `npx foley editor` from an install.

## Presets

36 complete sets, each with its own character:

| Mood        | Presets                                                     |
| ----------- | ----------------------------------------------------------- |
| Calm        | `soft`, `warm`, `felt`, `pad`, `dream`, `air`               |
| Natural     | `wood`, `bamboo`, `stone`, `plop`, `bubble`, `rain`         |
| Instruments | `pluck`, `kalimba`, `koto`, `musicbox`, `vibes`, `steel`    |
| Shimmer     | `glass`, `chime`, `ice`, `gong`, `celesta`, `fm`            |
| Digital     | `retro`, `arcade`, `blip`, `scifi`, `synth`, `robot`        |
| Mechanical  | `keys`, `typewriter`, `tactile`, `shutter`, `latch`, `coin` |

Each one has the same 19 sounds:

| What it's for                | Sounds                                               |
| ---------------------------- | ---------------------------------------------------- |
| Touching things              | `hover`, `tap`, `select`, `type`, `slide`            |
| Switching and panels         | `toggleOn`, `toggleOff`, `open`, `close`             |
| Moving things                | `navigate`, `back`, `send`, `drag`, `drop`, `remove` |
| Telling people what happened | `success`, `error`, `warning`, `notify`              |

Play any of them from code:

```tsx
const sounds = useSounds<typeof config>();
sounds.play("success");
```

Mix sets freely, since each sound is plain data:

```ts
const sounds = { ...felt, success: chime.success, error: glass.error };
```

## Make one yours

```ts
import { Sound } from "foley";
import { glass } from "foley/presets";

const sounds = {
  ...glass,
  tap: Sound.tweak(glass.tap, { pitch: -3, length: 1.4, bright: -0.3, gain: -2, room: 0.4 }),
};
```

`pitch` is in semitones, `length` multiplies the ring time, `bright` runs from -1 to 1, `gain` is in decibels and `room` runs from 0 to 1.

## Your own rules

`defaultRules` is a list, so put your own rules ahead of it. The first match wins.

```ts
const config = defineSounds({
  sounds: glass,
  rules: [{ match: ".danger", on: "click", play: "remove" }, { match: "[role=row]", on: "hover", play: "hover", volume: 0.5 }, ...defaultRules],
});
```

Sound names are checked: a rule that plays a sound not in `sounds` is a type error.

| Trigger   | Fires on                                                                           |
| --------- | ---------------------------------------------------------------------------------- |
| `click`   | `click`, including Enter and Space on a button                                     |
| `press`   | Primary pointer down                                                               |
| `release` | Primary pointer up                                                                 |
| `hover`   | The mouse moving onto the element. Never touch, or a page swap under a still mouse |
| `focus`   | Keyboard focus, using `:focus-visible`                                             |
| `type`    | Keys that edit text. Never password fields or shortcuts                            |
| `change`  | `change`, such as checkboxes and selects                                           |
| `slide`   | Dragging a range input                                                             |

Rules also take `volume`, `pitch` (a number, or a function of the element) and `throttle` in milliseconds. Hover defaults to 60 ms, typing to 40 ms and sliding to 45 ms.

Attributes beat rules, for one-off exceptions:

```html
<button data-sound="success">Plays success on click</button>
<a data-sound-hover="tap">Plays tap on hover</a>
<section data-sound="none">Everything in here is silent</section>
```

Disabled controls stay silent.

## Not on React?

The core has no framework in it:

```ts
import { createSounds, defaultRules } from "foley";
import { glass } from "foley/presets";

const sounds = createSounds({ sounds: glass, rules: defaultRules });
const stop = sounds.start();
sounds.play("success");
```

## Build from scratch

The easiest way is the Create page in the editor (`pnpm editor`, or `npx foley editor` from an install). Stack parts, shape them with plain sliders, save them in your browser, and copy the code.

In code, a sound is an object of tone and noise layers, which you can write by hand or save as JSON:

```ts
import { GLASS, Levels, Sound, strike } from "foley";

const chord = Sound.of([...strike(880, 0.4, 0.6, GLASS), ...strike(1320, 0.5, 0.5, GLASS, { offset: 0.08 })], { room: 0.4 });

// Match it to the rest of the palette.
const balanced = Levels.normalize(chord, -23);
```

`Sound.parse(json)` validates data from outside your code and returns `{ ok: true, sound }` or `{ ok: false, problems }`.

## Levels

Presets sit in three loudness tiers: frequent feedback at -30 dB, actions at -23 dB and results at -19 dB. A test holds all 684 to them. Use `Levels.of(sound)` to measure your own.

## Browsers

- Audio starts on the first gesture. Call `sounds.unlock()` yourself if you need the result.
- Sounds asked for while audio wakes up collapse to the latest one. If it waited over 250 ms it is dropped, since it would land detached from its cause.
- After 20 seconds of quiet the context suspends, so Safari releases the audio device.
- During SSR nothing happens: `createSounds` touches no browser API until `start` or `play`.

Your app owns preferences. `setVolume` and `setMuted` apply a setting, and Foley stores nothing.

## Develop

```sh
pnpm check   # typecheck, lint, tests, and the published type entry points
pnpm gains   # re-measure every preset after changing src/design.ts (runs on Bun)
pnpm editor  # the visual editor, with live reload
pnpm build          # library, CLI, and the editor bundle in dist/
pnpm foley editor   # open that build
npx foley editor    # same command once the package is installed
```

Installing the package copies `skills/foley` to `~/.agents/skills/foley` and prints that path. Agents that load skills from there can use it to navigate the package. pnpm skips dependency scripts until you allow them with `pnpm approve-builds`. If the install script did not run, `npx foley` installs the skill the first time it runs.

## License

MIT
