import { act } from "@testing-library/react";
import fc from "fast-check";
import type { ElementType, ReactNode } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Code } from "../editor/code.ts";
import { Draft, FEELS, finish, identifier, Library, Part, RECIPES, Shape, SOURCES, surprise } from "../editor/create.ts";
import { highlight } from "../editor/highlight.ts";
import { audio } from "../editor/parts.tsx";
import { Levels } from "../src/loudness.ts";
import { sets } from "../src/presets.ts";
import { Sound, type Tone } from "../src/sound.ts";
import { tick } from "./support.ts";

// happy-dom never finishes exit animations, so morphing text would pile up here. These tests are about what the text says.
vi.mock("torph/react", () => ({
  TextMorph: ({ as: As = "span", className, children }: { readonly as?: ElementType; readonly className?: string; readonly children: ReactNode }) => (
    <As className={className}>{children}</As>
  ),
}));

const button = (name: string) => {
  const found = [...document.querySelectorAll("button")].find((candidate) => candidate.textContent?.trim().startsWith(name));
  if (found === undefined) throw new Error(`the page has no button named ${name}`);
  return found;
};

const code = () => document.querySelector("pre")?.textContent ?? "";
const heading = () => document.querySelector(".sound h1")?.textContent;
const layers = () => document.querySelectorAll(".layer").length;
const firstSlider = (scope = ".sliders") => {
  const found = document.querySelector<HTMLInputElement>(`${scope} .slider input`);
  if (found === null) throw new Error(`the page has no slider in ${scope}`);
  return found;
};
/** Moves a slider the way a drag does: React only hears a value set through the native setter. */
const moveSlider = async (slider: HTMLInputElement, position: number) => {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(slider, String(Number(slider.max) * position));
    slider.dispatchEvent(new Event("input", { bubbles: true }));
  });
};
const goTo = async (hash: string) => {
  await act(async () => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
};

/** Clicks a button and returns the sound it played, failing if it played none. */
const heardFrom = async (element: HTMLButtonElement) => {
  const play = vi.spyOn(audio, "play");
  const configure = vi.spyOn(audio, "configure");
  await act(async () => element.click());
  expect(play).toHaveBeenCalledWith("preview");
  const preview = configure.mock.calls.map(([config]) => config.sounds.preview).find((sound) => sound !== undefined);
  play.mockRestore();
  configure.mockRestore();
  return preview;
};

describe("editor", () => {
  beforeAll(async () => {
    window.location.hash = "";
    localStorage.clear();
    document.body.innerHTML = `<div id="root"></div>`;
    await act(async () => {
      await import("../editor/main.tsx");
    });
  });

  it("opens on presets with a complete config", () => {
    expect(heading()).toBe("Glass");
    expect(code()).toContain("sounds: glass,");
  });

  it("shows one mood's presets at a time, and reaches all 36 across the 6 moods", async () => {
    const buttonsIn = (label: string) => [...document.querySelectorAll(`nav[aria-label="${label}"] button`)];
    const moods = buttonsIn("Moods").flatMap((mood) => (mood.textContent === null ? [] : [mood.textContent]));
    expect(moods).toHaveLength(6);
    const seen = new Set<string | null>();
    for (const mood of moods) {
      await act(async () => button(mood).click());
      expect(buttonsIn("Presets")).toHaveLength(6);
      for (const preset of buttonsIn("Presets")) seen.add(preset.textContent);
    }
    expect(seen.size).toBe(36);
    expect(buttonsIn("Sounds")).toHaveLength(19);
  });

  it("choosing a mood lands on its first preset", async () => {
    await act(async () => button("Digital").click());
    expect(heading()).toBe("Retro");
    expect(document.querySelector('nav[aria-label="Moods"] [aria-current="true"]')?.textContent).toBe("Digital");
    expect(code()).toContain('import { retro } from "tactone/presets"');
  });

  it("switches preset within a mood", async () => {
    await act(async () => button("Arcade").click());
    expect(heading()).toBe("Arcade");
    await act(async () => button("Retro").click());
    expect(heading()).toBe("Retro");
  });

  it("shows a slider's name and reading, and moves its pane with the value", async () => {
    const box = () => firstSlider().closest(".slider");
    expect(box()?.querySelector(".name")?.textContent).toBe("Pitch");
    expect(firstSlider().value).toBe(String(Number(firstSlider().max) / 2));
    await moveSlider(firstSlider(), 0);
    expect(box()?.querySelector(".reading")?.textContent).toBe("-12.0");
    expect(box()?.getAttribute("style")).toContain("--at: 0.0000");
    await moveSlider(firstSlider(), 1);
    expect(box()?.querySelector(".reading")?.textContent).toBe("+12.0");
    expect(box()?.getAttribute("style")).toContain("--at: 1.0000");
  });

  it("uses the same slider in the Try it bar, on a real range input the sound rules can hear", async () => {
    const slider = firstSlider(".try");
    expect(slider.type).toBe("range");
    await moveSlider(slider, 0.25);
    expect(document.querySelector(".try .reading")?.textContent).toBe("25%");
  });

  it("keeps the preset's name and description as separate blocks", () => {
    expect(document.querySelector(".sound header h1")?.textContent).toBe("Retro");
    expect(document.querySelector(".sound header .hint")?.textContent).toContain("8-bit");
  });

  it("reads top to bottom in the order of the centered stage", () => {
    const order = [...document.querySelectorAll(".stage-column > *")].map((part) => part.getAttribute("aria-label") ?? part.className);
    expect(order.slice(0, 3)).toEqual(["Browse presets", "The sound", "Sounds"]);
    expect(order.at(-1)).toContain("Try");
  });

  it("puts a mood's presets inside a panel named after it, directly under the tabs", () => {
    const browser = document.querySelector('[aria-label="Browse presets"]');
    expect(browser?.querySelector('nav[aria-label="Moods"] + nav[aria-label="Presets"]')).not.toBeNull();
    expect(browser?.querySelector('nav[aria-label="Presets"] h2')?.textContent).toBe("Digital presets");
  });

  it("copies the exact code from the code block, without line numbers", async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const block = document.querySelector(".codeblock");
    const copy = block?.querySelector(".code-copy");
    if (!(copy instanceof HTMLButtonElement)) throw new Error("the code block has no copy button");
    await act(async () => copy.click());
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('from "tactone/presets"'));
    expect(copy.textContent).toContain("Copied");
    expect(block?.querySelector(".token-keyword")?.textContent).toBe("import");
  });

  it("plays the selected sound, with its changes, from the copy button", async () => {
    // Earlier tests left Retro's tap with its pitch slider at the top: 12 semitones up.
    const expected = (sets.retro.tap.layers[0]?.frequency ?? 0) * 2;
    const copy = document.querySelector(".code-copy");
    if (!(copy instanceof HTMLButtonElement)) throw new Error("the page is missing a copy button");
    const preview = await heardFrom(copy);
    expect(preview?.layers[0]?.frequency).toBeCloseTo(expected);
  });

  it("has one copy button, in the code block", () => {
    expect(() => button("Copy code")).toThrow();
    expect(document.querySelectorAll(".code-copy")).toHaveLength(1);
  });

  it("says when the WAV has downloaded", async () => {
    await act(async () => button("WAV").click());
    expect(document.querySelector(".toast[data-tone='success']")?.textContent).toBe("Downloaded retro-tap.wav");
  });

  it("says when the WAV could not download", async () => {
    const create = vi.spyOn(URL, "createObjectURL").mockImplementation(() => {
      throw new Error("blob URLs are blocked");
    });
    await act(async () => button("WAV").click());
    create.mockRestore();
    expect(document.querySelector(".toast[data-tone='error']")?.textContent).toContain("blob URLs are blocked");
  });

  it("opens the code block on demand and renames its title to the file", async () => {
    const toggle = document.querySelector(".code-toggle");
    if (!(toggle instanceof HTMLButtonElement)) throw new Error("the code block has no toggle");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await act(async () => toggle.click());
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(toggle.textContent).toContain("tactone.config.ts");
  });

  it("puts a change into the code, and Reset takes it back out", async () => {
    expect(code()).toContain("tap: Sound.tweak(retro.tap, { pitch: 12.0 })");
    await act(async () => button("Reset").click());
    expect(code()).toContain("sounds: retro,");
  });

  it("opens a preset in Create", async () => {
    await act(async () => button("Edit in Create").click());
    expect(window.location.hash).toBe("#/create");
    expect(document.querySelector<HTMLInputElement>(".field input")?.value).toBe("My tap");
  });

  it("walks a beginner through three steps in order", () => {
    const steps = [...document.querySelectorAll(".path h2")].map((step) => step.textContent);
    expect(steps[0]).toContain("Start with something close");
    expect(steps[1]).toContain("Shape it");
    expect(steps[2]).toContain("Add more");
  });

  it("says what every starting point is for", () => {
    const tiles = [...document.querySelectorAll(".path section:first-child .tile")];
    expect(tiles).toHaveLength(RECIPES.length + 1);
    for (const tile of tiles) expect(tile.querySelector("small")?.textContent).not.toBe("");
  });

  it("hides layers until there is more than one sound", async () => {
    await act(async () => button("Note").click());
    expect(layers()).toBe(0);
    await act(async () => button("+ Click").click());
    expect(layers()).toBe(2);
    await act(async () => button("Remove").click());
    expect(layers()).toBe(0);
  });

  it("shapes the whole sound with one slider", async () => {
    await act(async () => button("Bell").click());
    expect(document.querySelector(".tile[aria-pressed='true'] strong")?.textContent).toBe("Bell");
    const before = code();
    await moveSlider(firstSlider(), 1);
    expect(code()).not.toBe(before);
  });

  it("starts over, back to the sound it began from", async () => {
    await act(async () => button("Start over").click());
    expect(firstSlider().value).toBe(String(Number(firstSlider().max) / 2));
    expect(document.body.textContent).not.toContain("Start over");
  });

  it("changes what the sound is like, in plain words", async () => {
    await act(async () => button("Airy").click());
    expect(code()).toContain('kind: "noise"');
    expect(document.querySelector(".segments [aria-pressed='true']")?.textContent).toBe("Airy");
  });

  it("saves a sound and offers it again", async () => {
    await act(async () => button("Save").click());
    expect(document.querySelector('[role="status"]')?.textContent).toContain('Saved "My tap"');
    expect(Library.load().map((sound) => sound.name)).toEqual(["My tap"]);
    await act(async () => button("Note").click());
    await act(async () => button("My tap").click());
    expect(code()).toContain('kind: "noise"');
  });

  it("exports code that uses the name as an identifier", () => {
    expect(code()).toContain("export const myTap: Sound");
  });

  it("plays the sound being made from the copy button on Create", async () => {
    const copy = document.querySelector(".code-copy");
    if (!(copy instanceof HTMLButtonElement)) throw new Error("the page is missing a copy button");
    const preview = await heardFrom(copy);
    expect(preview?.layers[0]?.kind).toBe("noise");
  });

  it("returns to presets", async () => {
    await goTo("#/");
    expect(heading()).toBe("Glass");
  });
});

describe("highlight", () => {
  const kindOf = (line: string, text: string) => highlight(line).find((token) => token.text === text)?.kind;

  it("never loses or changes a character", () => {
    fc.assert(
      fc.property(fc.string(), (line) => {
        fc.pre(!line.includes("\n"));
        expect(
          highlight(line)
            .map((token) => token.text)
            .join(""),
        ).toBe(line);
      }),
    );
  });

  it.each([
    ['import { glass } from "tactone/presets";', "import", "keyword"],
    ['import { glass } from "tactone/presets";', '"tactone/presets"', "string"],
    ["export const config = defineSounds({", "defineSounds", "function"],
    ["  rules: defaultRules,", "rules", "property"],
    ["export const tap: Sound = {", "Sound", "type"],
    ["  gain: 0.42,", "0.42", "number"],
    ["  gain: -2.5,", "-2.5", "number"],
    ["// Then wrap your app", "// Then wrap your app", "comment"],
  ])("in %j, %s is a %s", (line, text, kind) => {
    expect(kindOf(line, text)).toBe(kind);
  });

  it("does not highlight a keyword inside a comment or a string", () => {
    expect(highlight("// import this")).toHaveLength(1);
    expect(kindOf('"import"', '"import"')).toBe("string");
  });

  it("leaves a word that merely contains a keyword alone", () => {
    expect(kindOf("imported", "imported")).toBe("plain");
  });
});

describe("Part", () => {
  const base: Tone = { kind: "tone", wave: "sine", frequency: 440, attack: 0.001, decay: 0.1, peak: 0.5 };

  it("round-trips every source", () => {
    for (const source of SOURCES) expect(Part.source(Part.setSource(base, source))).toBe(source);
  });

  it("offers every source to beginners under a plain name", () => {
    expect(FEELS.map((feel) => feel.source).sort()).toEqual([...SOURCES].sort());
  });

  it("keeps pitch and shape when the source changes", () => {
    const noise = Part.setSource(Part.setBend(base, 12), "air");
    expect(noise.frequency).toBe(440);
    expect(Part.bend(noise)).toBeCloseTo(12);
  });

  it("removes the bend at zero, so a straight part stays straight", () => {
    expect(Part.setBend(Part.setBend(base, 7), 0).glideTo).toBeUndefined();
  });

  it("carries the bend along when the pitch moves", () => {
    const moved = Part.setPitch(Part.setBend(base, 7), 880);
    expect(moved.frequency).toBe(880);
    expect(Part.bend(moved)).toBeCloseTo(7);
  });
});

describe("Shape", () => {
  const part: Tone = { kind: "tone", wave: "sine", frequency: 440, attack: 0.002, decay: 0.1, peak: 0.5 };

  it("changes nothing when neutral", () => {
    expect(Shape.apply([part], Shape.neutral)).toEqual([part]);
  });

  it("moves every part together", () => {
    const [low, high] = Shape.apply([part, { ...part, frequency: 880 }], { ...Shape.neutral, pitch: 12, length: 2 });
    expect(low?.frequency).toBeCloseTo(880);
    expect(high?.frequency).toBeCloseTo(1760);
    expect(low?.decay).toBeCloseTo(0.2);
  });

  it("adds to a bend the part already has", () => {
    const [bent] = Shape.apply([Part.setBend(part, 5)], { ...Shape.neutral, bend: 7 });
    if (bent === undefined) throw new Error("expected a part");
    expect(Part.bend(bent)).toBeCloseTo(12);
  });

  it("keeps a fade-in within what the page can make", () => {
    const [slow] = Shape.apply([{ ...part, attack: 0.2 }], { ...Shape.neutral, attack: 32 });
    expect(slow?.attack).toBeLessThanOrEqual(0.4);
  });
});

describe("Draft", () => {
  const recipe = RECIPES[0];
  if (recipe === undefined) throw new Error("expected a recipe");

  it("saves exactly the sound being heard", () => {
    const draft = { ...Draft.of("x", recipe.parts, 0.2), shape: { ...Shape.neutral, pitch: 5, length: 1.5 } };
    const saved = Draft.saved(draft);
    expect(Draft.sound(Draft.of("x", saved.parts, saved.room, saved.volume)).layers).toEqual(Draft.sound(draft).layers);
  });

  it("knows when it has changed", () => {
    const draft = Draft.of("x", recipe.parts, 0.2);
    expect(Draft.isChanged(draft)).toBe(false);
    expect(Draft.isChanged({ ...draft, volume: 3 })).toBe(true);
    expect(Draft.isChanged({ ...draft, shape: { ...Shape.neutral, pitch: 1 } })).toBe(true);
  });
});

describe("finish", () => {
  it.each(RECIPES.map((recipe) => [recipe.name, recipe] as const))("balances the %s recipe to a usable level", (_name, recipe) => {
    const { peak, loudness } = Levels.of(finish(recipe.parts, recipe.room, 0));
    expect(peak).toBeLessThanOrEqual(-3.9);
    expect(loudness).toBeGreaterThan(-32);
  });

  it("makes every surprise valid and audible", () => {
    let seed = 1;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let run = 0; run < 40; run += 1) {
      const { parts, room } = surprise(random);
      const sound = finish(parts, room, 0);
      const parsed = Sound.parse(JSON.parse(JSON.stringify(sound)));
      expect(parsed.ok ? [] : parsed.problems).toEqual([]);
      expect(Levels.of(sound).peak).toBeGreaterThan(-40);
    }
  });

  it("applies the user's volume on top of the balance", () => {
    const recipe = RECIPES[0];
    if (recipe === undefined) throw new Error("expected a recipe");
    const difference = Levels.of(finish(recipe.parts, 0, 6)).peak - Levels.of(finish(recipe.parts, 0, 0)).peak;
    expect(difference).toBeCloseTo(6, 0);
  });

  it("survives having no parts", () => {
    expect(finish([], 0, 0).layers).toEqual([]);
  });
});

describe("Library", () => {
  it("skips corrupt entries and keeps good ones", () => {
    const good = { name: "Good", parts: [{ kind: "tone", wave: "sine", frequency: 440, attack: 0, decay: 0.1, peak: 0.5 }], room: 0, volume: 0 };
    localStorage.setItem("tactone.sounds", JSON.stringify([good, { name: "Bad", parts: "nope", room: 0, volume: 0 }, 7]));
    expect(Library.load().map((sound) => sound.name)).toEqual(["Good"]);
  });

  it("returns nothing for unreadable storage rather than throwing", () => {
    localStorage.setItem("tactone.sounds", "{not json");
    expect(Library.load()).toEqual([]);
  });
});

describe("identifier", () => {
  it.each([
    ["My cool sound!", "myCoolSound"],
    ["  ", "mySound"],
    ["2 fast", "sound2Fast"],
  ])("turns %j into %s", (name, expected) => {
    expect(identifier(name)).toBe(expected);
  });
});

describe("Code", () => {
  it("writes a WAV of the right type", () => {
    expect(Code.wav(tick).size).toBeGreaterThan(44);
    expect(Code.wav(tick).type).toBe("audio/wav");
  });

  it("leaves unchanged values out", () => {
    const text = Code.config("felt", [{ purpose: "tap", tweak: { pitch: 0, length: 1.5, bright: 0, gain: 0, room: 0.1 }, room: 0.1 }]);
    expect(text).toContain("tap: Sound.tweak(felt.tap, { length: 1.50 })");
  });

  it("drops a change that returned to neutral", () => {
    const text = Code.config("felt", [{ purpose: "tap", tweak: { pitch: 0, length: 1, bright: 0, gain: 0, room: 0.1 }, room: 0.1 }]);
    expect(text).toContain("sounds: felt,");
  });
});
