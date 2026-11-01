/**
 * Typechecks the published declarations the way an app would import them.
 * `pnpm check:package` builds dist, then compiles this file against it.
 */

import { createSounds, defaultRules, defineSounds, GLASS, Levels, Sound, strike } from "foley";
import { chime, felt, glass } from "foley/presets";
import { SoundRoot, useSounds } from "foley/react";

const config = defineSounds({ sounds: glass, rules: defaultRules });

const mixed = { ...felt, success: chime.success, error: glass.error };

const shaped = {
  ...glass,
  tap: Sound.tweak(glass.tap, { pitch: -3, length: 1.4, bright: -0.3, gain: -2, room: 0.4 }),
};

const custom = defineSounds({
  sounds: glass,
  rules: [{ match: ".danger", on: "click", play: "remove" }, { match: "[role=row]", on: "hover", play: "hover", volume: 0.5 }, ...defaultRules],
});

const chord = Sound.of([...strike(880, 0.4, 0.6, GLASS), ...strike(1320, 0.5, 0.5, GLASS, { offset: 0.08 })], { room: 0.4 });
const balanced = Levels.normalize(chord, -23);

const onlyTap = defineSounds({
  sounds: { tap: glass.tap },
  rules: [{ match: "button", on: "click", play: "tap" }],
});

defineSounds({
  sounds: { tap: glass.tap },
  rules: [
    {
      match: "button",
      on: "click",
      // @ts-expect-error "success" is not one of the sounds in this config
      play: "success",
    },
  ],
});

function Player() {
  const sounds = useSounds<typeof config>();
  sounds.play("success");
  // @ts-expect-error "nope" is not a sound on this config
  sounds.play("nope");
  return null;
}

export function App() {
  const started = createSounds({ sounds: glass, rules: defaultRules });
  const stop = started.start();
  started.play("success");
  stop();

  return (
    <SoundRoot config={config}>
      <Player />
    </SoundRoot>
  );
}

void mixed;
void shaped;
void custom;
void balanced;
void onlyTap;
