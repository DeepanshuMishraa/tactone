import { cleanup, render as mount } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Port } from "../src/engine.ts";
import { SoundRoot, useSounds } from "../src/react.tsx";
import { Sound } from "../src/sound.ts";
import { createSounds, defineSounds } from "../src/sounds.ts";

const make = (frequency: number) => Sound.of([{ kind: "tone", wave: "sine", frequency, attack: 0.001, decay: 0.05, peak: 0.5 }]);
const library = { pop: make(300), tick: make(600), on: make(900), off: make(1200) };

function Lonely() {
  useSounds();
  return null;
}

function harness(rules: Parameters<typeof defineSounds<keyof typeof library>>[0]["rules"] = []) {
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
        played.push(sound.layers[0]?.frequency ?? 0);
      },
      silence: () => {},
      setLevel: () => {},
    },
  };
  const onError = vi.fn();
  const sounds = createSounds({ sounds: library, rules: rules ?? [], connect: () => port, onError });
  const stop = sounds.start();
  return { played, sounds, stop, onError };
}

const stage = (html: string) => {
  document.body.innerHTML = html;
};
const element = (selector: string) => {
  const found = document.querySelector(selector);
  if (found === null) throw new Error(`test markup has no ${selector}`);
  return found;
};
const click = (selector: string) => element(selector).dispatchEvent(new MouseEvent("click", { bubbles: true }));
const hover = (selector: string, clientX: number, timeStamp = clientX) => {
  const event = new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse", clientX, clientY: 0 });
  Object.defineProperty(event, "timeStamp", { value: timeStamp });
  element(selector).dispatchEvent(event);
};

describe("rules at the root", () => {
  let stop = () => {};
  afterEach(() => {
    stop();
    cleanup();
    document.body.innerHTML = "";
  });
  beforeEach(() => {
    stop = () => {};
  });

  it("plays the first matching rule, including for a child of the matched element", () => {
    const h = harness([
      { match: ".danger", on: "click", play: "off" },
      { match: "button", on: "click", play: "pop" },
    ]);
    stop = h.stop;
    stage(`<button id="a"><svg id="icon"></svg></button><button id="b" class="danger"></button>`);
    click("#icon");
    click("#b");
    expect(h.played).toEqual([300, 1200]);
  });

  it("still plays when the app stops propagation", () => {
    const h = harness([{ match: "button", on: "click", play: "pop" }]);
    stop = h.stop;
    stage(`<button id="a"></button>`);
    element("#a").addEventListener("click", (event) => event.stopPropagation());
    click("#a");
    expect(h.played).toEqual([300]);
  });

  it("stays silent on disabled controls", () => {
    const h = harness([{ match: "button", on: "click", play: "pop" }]);
    stop = h.stop;
    stage(`<button id="a" aria-disabled="true"></button>`);
    click("#a");
    expect(h.played).toEqual([]);
  });

  it("lets a rule choose from the element's state", () => {
    const h = harness([{ match: "input", on: "click", play: (el) => (el instanceof HTMLInputElement && el.checked ? "on" : "off") }]);
    stop = h.stop;
    // Browsers flip `checked` before click listeners run, so a rule reads the state the click produced.
    stage(`<input id="a" type="checkbox" />`);
    click("#a");
    click("#a");
    expect(h.played).toEqual([900, 1200]);
  });

  it("lets an attribute override a rule, or silence a whole subtree", () => {
    const h = harness([{ match: "button", on: "click", play: "pop" }]);
    stop = h.stop;
    stage(`<button id="a" data-sound="tick"></button><section data-sound="none"><button id="b"></button></section><button id="c" data-sound-click="on"></button>`);
    click("#a");
    click("#b");
    click("#c");
    expect(h.played).toEqual([600, 900]);
  });

  it("reports an attribute naming no sound, and plays nothing", () => {
    const h = harness();
    stop = h.stop;
    stage(`<button id="a" data-sound="nope"></button>`);
    click("#a");
    expect(h.played).toEqual([]);
    expect(h.onError.mock.calls[0]?.[0]?.message).toContain('"nope"');
  });

  it("ignores hover from a DOM swap under a still mouse, and from page load", () => {
    const h = harness([{ match: "a", on: "hover", play: "tick", throttle: 0 }]);
    stop = h.stop;
    stage(`<a id="a"></a>`);
    hover("#a", 10);
    hover("#a", 10);
    expect(h.played).toEqual([]);
    hover("#a", 11);
    expect(h.played).toEqual([600]);
  });

  it("throttles hover by the rule's gap", () => {
    const h = harness([{ match: "a", on: "hover", play: "tick", throttle: 100 }]);
    stop = h.stop;
    stage(`<a id="a"></a>`);
    hover("#a", 1, 0);
    hover("#a", 2, 200);
    hover("#a", 3, 250);
    hover("#a", 4, 400);
    expect(h.played).toEqual([600, 600]);
  });

  it.each([
    ["password", false],
    ["text", true],
    ["checkbox", false],
  ])("type on an input of type %s plays: %s", (type, plays) => {
    const h = harness([{ match: "input", on: "type", play: "tick" }]);
    stop = h.stop;
    stage(`<input id="a" type="${type}" />`);
    element("#a").dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "x" }));
    expect(h.played).toEqual(plays ? [600] : []);
  });

  it("does not count shortcuts as typing", () => {
    const h = harness([{ match: "input", on: "type", play: "tick" }]);
    stop = h.stop;
    stage(`<input id="a" />`);
    element("#a").dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "s", metaKey: true }));
    expect(h.played).toEqual([]);
  });

  it("stops listening when stopped", () => {
    const h = harness([{ match: "button", on: "click", play: "pop" }]);
    stage(`<button id="a"></button>`);
    h.stop();
    click("#a");
    expect(h.played).toEqual([]);
  });

  it("reconfigures live", () => {
    const h = harness([{ match: "button", on: "click", play: "pop" }]);
    stop = h.stop;
    stage(`<button id="a"></button>`);
    h.sounds.configure({ sounds: library, rules: [{ match: "button", on: "click", play: "tick" }] });
    click("#a");
    expect(h.played).toEqual([600]);
  });
});

describe("types", () => {
  it("rejects a rule or play naming a sound that does not exist", () => {
    const config = defineSounds({
      sounds: library,
      // @ts-expect-error "missing" is not in sounds
      rules: [{ match: "a", on: "click", play: "missing" }],
    });
    const sounds = createSounds({ ...config, connect: () => null });
    // @ts-expect-error "missing" is not in sounds
    expect(() => sounds.play("missing")).not.toThrow();
  });
});

describe("<SoundRoot>", () => {
  afterEach(cleanup);

  it("throws a helpful error when useSounds has no root", () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => mount(<Lonely />)).toThrow(/outside <SoundRoot>/);
    quiet.mockRestore();
  });

  it("applies the config to the page and stops on unmount", () => {
    const played: number[] = [];
    const port: Port = {
      state: () => "running",
      now: () => performance.now(),
      resume: async () => {},
      suspend: async () => {},
      prime: () => {},
      bus: { play: (s) => played.push(s.layers[0]?.frequency ?? 0), silence: () => {}, setLevel: () => {} },
    };
    const config = { sounds: library, rules: [{ match: "button", on: "click" as const, play: "pop" as const }], connect: () => port };
    const view = mount(
      <SoundRoot config={config}>
        <button type="button" id="a" />
      </SoundRoot>,
    );
    click("#a");
    expect(played).toEqual([300]);
    const button = element("#a");
    view.unmount();
    document.body.append(button);
    click("#a");
    expect(played).toEqual([300]);
    button.remove();
  });
});
