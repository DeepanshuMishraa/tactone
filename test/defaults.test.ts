import { afterEach, describe, expect, it } from "vitest";
import { defaultRules } from "../src/defaults.ts";
import type { Port } from "../src/engine.ts";
import { glass } from "../src/presets.ts";
import { createSounds, defineSounds } from "../src/sounds.ts";

function harness() {
  const played: number[] = [];
  let time = 0;
  const port: Port = {
    state: () => "running",
    now: () => {
      time += 1;
      return time;
    },
    resume: async () => {},
    suspend: async () => {},
    prime: () => {},
    bus: {
      play: (sound) => {
        played.push(sound.layers.at(-1)?.frequency ?? 0);
      },
      silence: () => {},
      setLevel: () => {},
    },
  };
  // random 0.5 means no per-play variation, so frequencies identify sounds exactly.
  const sounds = createSounds({ sounds: glass, rules: defaultRules, connect: () => port, random: () => 0.5 });
  return { played, stop: sounds.start() };
}

const lastFrequency = (name: keyof typeof glass) => glass[name].layers.at(-1)?.frequency;

const stage = (html: string) => {
  document.body.innerHTML = html;
};
const element = (selector: string) => {
  const found = document.querySelector(selector);
  if (found === null) throw new Error(`test markup has no ${selector}`);
  return found;
};
const click = (selector: string) => element(selector).dispatchEvent(new MouseEvent("click", { bubbles: true }));

describe("defaultRules", () => {
  let stop = () => {};
  afterEach(() => {
    stop();
    document.body.innerHTML = "";
  });

  it("is a complete config: a set and the rules type-check together", () => {
    expect(defineSounds({ sounds: glass, rules: defaultRules }).sounds).toBe(glass);
  });

  it.each([
    [`<button id="x"></button>`, "tap"],
    [`<button id="x" type="submit"></button>`, "send"],
    [`<a id="x" href="/next"></a>`, "navigate"],
    [`<details><summary id="x"></summary></details>`, "open"],
    [`<div id="x" role="tab"></div>`, "select"],
  ] as const)("%s plays %s", (html, name) => {
    const h = harness();
    stop = h.stop;
    stage(html);
    click("#x");
    expect(h.played).toEqual([lastFrequency(name)]);
  });

  it("reads a checkbox's new state, and a role=switch's old one", () => {
    const h = harness();
    stop = h.stop;
    stage(`<input id="a" type="checkbox" /><div id="b" role="switch" aria-checked="true"></div>`);
    const box = element("#a");
    if (box instanceof HTMLInputElement) box.checked = true;
    box.dispatchEvent(new Event("change", { bubbles: true }));
    click("#b");
    expect(h.played).toEqual([lastFrequency("toggleOn"), lastFrequency("toggleOff")]);
  });

  it("rises in pitch as a slider moves up", () => {
    const h = harness();
    stop = h.stop;
    stage(`<input id="a" type="range" min="0" max="100" value="0" />`);
    const slider = element("#a");
    if (!(slider instanceof HTMLInputElement)) throw new Error("expected an input");
    const moveTo = (value: string, timeStamp: number) => {
      slider.value = value;
      const event = new Event("input", { bubbles: true });
      Object.defineProperty(event, "timeStamp", { value: timeStamp });
      slider.dispatchEvent(event);
    };
    moveTo("0", 1000);
    moveTo("100", 2000);
    const [low, high] = h.played;
    expect(high).toBeGreaterThan(low ?? Number.POSITIVE_INFINITY);
  });
});
