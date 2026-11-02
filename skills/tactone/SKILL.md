---
name: tactone
description: Navigate the Tactone package, a library of synthesized interface sounds with a typed npm entry, a React binding, 36 presets, and an editor opened by `npx tactone editor`. Use this whenever the work is in this repo or about Tactone sounds, presets, rules, loudness, the editor, the CLI, or the published package, including when the user only says a sound is wrong, a preset should change, or the editor should open.
---

# Tactone

Tactone synthesizes interface sounds in the browser. There are no audio files. A style is the timbre (`glass`, `retro`). A purpose is the gesture (`tap`, `success`). Every preset is one style playing all 19 purposes. Apps import a preset, pass it to `defineSounds` with `defaultRules`, and wrap the tree in `SoundRoot`.

Read the file that owns the change. The README is the public contract. `test/consumer/usage.tsx` compiles that contract against `dist/`, so a public example that typechecks there is a public example that ships.

## Map

| Path                       | Owns                                                                                    |
| -------------------------- | --------------------------------------------------------------------------------------- |
| `src/sound.ts`             | The sound value: layers, `Sound.parse`, `Sound.tweak`, `Sound.of`                       |
| `src/layers.ts`            | Hand-written gestures (`strike`, `thump`, `GLASS`, `WOOD`) for sounds built in app code |
| `src/design.ts`            | `STYLES`, `PURPOSES`, `VOICES`, `GESTURES`, `design()`, loudness tiers                  |
| `src/gains.ts`             | Per-sound gain that hits those tiers. Generated.                                        |
| `src/presets.ts`           | The 36 named sets (`glass`, `felt`, …) and `sets`                                       |
| `src/rules.ts`             | Which DOM event plays which sound. `Rules.decide` is pure                               |
| `src/defaults.ts`          | `defaultRules`, the stock binding from controls to purposes                             |
| `src/sounds.ts`            | `defineSounds`, `createSounds`, the page-level listener                                 |
| `src/react.tsx`            | `SoundRoot`, `useSounds`. The only file that imports React                              |
| `src/engine.ts`            | Unlock, idle suspend, stale-sound drop. No node graph                                   |
| `src/driver.ts`            | The only Web Audio graph                                                                |
| `src/render.ts`            | Offline samples for loudness, the editor waveform, and WAV export                       |
| `src/loudness.ts`          | `Levels.of`, `Levels.normalize`                                                         |
| `src/index.ts`             | The `tactone` export. Presets stay on `tactone/presets` so one set can tree-shake           |
| `editor/`                  | The two-page editor. Vite root is this directory                                        |
| `cli/cli.ts`               | `npx tactone` and `npx tactone editor`. Serves `dist/editor`                                |
| `scripts/gains.ts`         | Rewrites `src/gains.ts`. Run with `pnpm gains` (Bun)                                    |
| `scripts/declarations.mjs` | Rewrites `.ts` specifiers in `dist/*.d.ts` to `.js`                                     |
| `test/consumer/`           | Typecheck of the README against the built declarations                                  |

Setup examples for plain React, Next.js, TanStack Start and no framework appear in three places: the README, `site/docs.tsx` and `site/public/agents.md`, which the site serves at `/agents.md` for coding agents. Change one and change all three. In every example, `config` is defined at module level, because `SoundRoot` reconfigures whenever its reference changes.

| Path                    | Owns                                                       |
| ----------------------- | ---------------------------------------------------------- |
| `site/`                 | The marketing site and docs. `pnpm site`, `pnpm site:build` |
| `site/wrangler.jsonc`   | The Cloudflare Worker serving `site/dist` at tactone.dipxsy.app |
| `pnpm site:deploy`      | Builds the site and deploys it with `wrangler`              |

`src/index.ts` does not re-export presets. A new public function belongs on the entry that already owns that idea, then in the README and `test/consumer/usage.tsx`.

## Changing a sound

A style change is a `VOICES` entry in `src/design.ts`: root pitch, ring, room, and `play`, which returns layers. A purpose change is a `GESTURES` entry: which notes, how loud a tier, and whether repeated plays vary. `design()` multiplies them. `TIER_LOUDNESS` is the target: frequent feedback at -30 dB, actions at -23 dB, results at -19 dB. `PEAK_LIMIT` is -4 dB.

After either change, run `pnpm gains`. It measures all 684 sounds and writes `src/gains.ts`. Hand-editing that file is overwritten on the next run, and `test/presets.test.ts` fails until the gains match the new design.

A new style also needs a named export and a `sets` entry in `src/presets.ts`, a card in `MOODS` in `editor/main.tsx`, and a row in the README table. A new purpose needs a key in `PURPOSES`, `GESTURES`, and the object inside `set()` in `src/presets.ts`. Give it a `defaultRules` row only when a real control should play it. The first matching rule wins, so a new row goes above the broad ones it should beat.

`src/layers.ts` is the other way to make a sound: app code calls `strike` and `Sound.of` directly. That path does not go through `design()` or gains.

## Playback

`createSounds` is safe during SSR. It touches no browser API until `start` or `play`. `src/driver.ts` is the only module that builds Web Audio nodes. `src/render.ts` repeats the filter and envelope math without the room, because loudness and the waveform ignore that shared tail. Change the envelope or the filter in both, or the editor picture and the played sound drift apart.

`src/react.tsx` stays a thin wrapper and starts with `"use client"`. The core has no React dependency. React is an optional peer.

## Editor and the npm command

`pnpm editor` is the Vite dev server. `pnpm build` compiles the library, rewrites declaration specifiers, compiles `cli/cli.ts` to `dist/cli.js`, and bundles the editor to `dist/editor`. `pnpm tactone editor` serves that bundle and opens it. The published package does the same through the `tactone` bin, so `npx tactone editor` works after install. `prepack` runs the build. Publish `dist/` and `skills/tactone`. The package runs no install scripts.

Source imports end in `.ts`. The JS emit rewrites those to `.js`. Declaration files need `scripts/declarations.mjs` as well, because TypeScript leaves `.ts` in the `.d.ts` and older resolvers reject that.

## Checks

`pnpm check` is the full gate: typecheck, Biome, Vitest, then `check:package` (emit, rewrite declarations, typecheck `test/consumer`). Use `pnpm test` when you only changed runtime behavior. Use `pnpm gains` before that if `src/design.ts` changed a voice, a gesture, or a tier.

## This copy

`npx tactone skill` copies `skills/tactone` to `~/.agents/skills/tactone` and prints that path. Nothing else writes there. Edit the file in the repo. The next `npx tactone skill` replaces the home-directory copy.
