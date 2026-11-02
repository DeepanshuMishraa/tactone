import { StrictMode, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { defaultRules } from "../src/defaults.ts";
import { type Purpose, type Style, sets } from "../src/presets.ts";
import { Sound, type Tweak } from "../src/sound.ts";
import { type Change, Code } from "./code.ts";
import { Draft, RECIPES } from "./create.ts";
import { CreatePage } from "./create-page.tsx";
import { audio, CodeBlock, Format, Morph, moveThroughGrid, Slider, Toast, useAudition, useSpaceToPlay, useWavExport, Wave } from "./parts.tsx";
import "./styles.css";

import { MOODS, PRESET_LIST, SOUND_LIST } from "./catalog.ts";

type PresetShape = Required<Tweak>;
const shapeOf = (sound: Sound): PresetShape => ({ pitch: 0, length: 1, bright: 0, gain: 0, room: sound.room ?? 0 });
const shapeKey = (style: Style, purpose: Purpose) => `${style}:${purpose}`;

const firstRecipe = RECIPES[0];
const FIRST_DRAFT = Draft.of("My sound", firstRecipe?.parts ?? [], firstRecipe?.room ?? 0);

function PresetsPage({ onCreateFrom }: { readonly onCreateFrom: (draft: Draft) => void }) {
  const [style, setStyle] = useState<Style>("glass");
  const [purpose, setPurpose] = useState<Purpose>("tap");
  const [shapes, setShapes] = useState<Readonly<Record<string, PresetShape>>>({});
  const [tryValue, setTryValue] = useState(0.5);
  const { toast, save } = useWavExport();
  const demo = useRef<HTMLFormElement>(null);

  const soundOf = (forStyle: Style, forPurpose: Purpose) => {
    const shape = shapes[shapeKey(forStyle, forPurpose)];
    return shape === undefined ? sets[forStyle][forPurpose] : Sound.tweak(sets[forStyle][forPurpose], shape);
  };

  const liveSet = Object.fromEntries(SOUND_LIST.map(({ id }) => [id, soundOf(style, id)]));
  const { hear, hearSoon, plays } = useAudition(liveSet);
  // The bar at the bottom runs the real library on real controls, so what you hear there is what your app gets.
  audio.configure({ sounds: liveSet, rules: defaultRules });

  const original = sets[style][purpose];
  const shape = shapes[shapeKey(style, purpose)] ?? shapeOf(original);
  const edited = shapes[shapeKey(style, purpose)] !== undefined;
  const current = useMemo(() => Sound.tweak(original, shape), [original, shape]);

  useEffect(() => {
    if (demo.current === null) return;
    return audio.start(demo.current);
  }, []);

  const replay = useCallback(() => hear(current), [hear, current]);
  useSpaceToPlay(replay);

  const setControl = (id: keyof PresetShape, value: number) => {
    const nextShape = { ...shape, [id]: value };
    setShapes({ ...shapes, [shapeKey(style, purpose)]: nextShape });
    hearSoon(Sound.tweak(original, nextShape));
  };

  const reset = () => {
    const { [shapeKey(style, purpose)]: _removed, ...rest } = shapes;
    setShapes(rest);
    hear(original);
  };

  const changes: readonly Change[] = SOUND_LIST.flatMap(({ id }) => {
    const changed = shapes[shapeKey(style, id)];
    return changed === undefined ? [] : [{ purpose: id, tweak: changed, room: sets[style][id].room ?? 0 }];
  });
  const code = Code.config(style, changes);
  const preset = PRESET_LIST.find((item) => item.id === style);
  const mood = MOODS.find((item) => item.styles.some((choice) => choice.id === style));
  const soundName = SOUND_LIST.find((item) => item.id === purpose)?.name ?? purpose;

  return (
    <main className="stage">
      <div className="stage-column">
        {/* The active mood is a tab joined to the panel below it, so its presets visibly belong to it. */}
        <section className="browser" aria-label="Browse presets">
          <nav className="moods" aria-label="Moods" onKeyDown={moveThroughGrid}>
            {MOODS.map((item) => (
              <button
                type="button"
                key={item.title}
                aria-current={item === mood}
                onClick={() => {
                  // A mood is never empty, and choosing one always lands on a preset you can hear.
                  const first = item.styles[0];
                  if (first === undefined) return;
                  setStyle(first.id);
                  hear(soundOf(first.id, purpose));
                }}
              >
                {item.title}
              </button>
            ))}
          </nav>

          <nav className="presets card" aria-label="Presets" onKeyDown={moveThroughGrid}>
            <h2>
              <Morph>{`${mood?.title ?? ""} presets`}</Morph>
            </h2>
            <div className="preset-grid">
              {mood?.styles.map((choice) => (
                <button
                  type="button"
                  key={choice.id}
                  aria-current={choice.id === style}
                  onClick={() => {
                    setStyle(choice.id);
                    hear(soundOf(choice.id, purpose));
                  }}
                >
                  {choice.name}
                </button>
              ))}
            </div>
          </nav>
        </section>

        <section className="sound card" aria-label="The sound">
          <header>
            <div>
              <h1>
                <Morph>{preset?.name ?? style}</Morph>
              </h1>
              <p className="hint">
                <Morph>{preset?.hint ?? ""}</Morph>
              </p>
            </div>
            <button type="button" className="play" onClick={replay}>
              <Morph>{`Play ${soundName.toLowerCase()}`}</Morph> <kbd>space</kbd>
            </button>
          </header>

          <Wave sound={current} plays={plays} />

          <div className="sliders pair">
            <Slider label="Pitch" min={-12} max={12} value={shape.pitch} format={Format.semitones} onChange={(v) => setControl("pitch", v)} onCommit={replay} />
            <Slider label="Length" min={0.4} max={2.5} scale="log" value={shape.length} format={Format.times} onChange={(v) => setControl("length", v)} onCommit={replay} />
            <Slider label="Brightness" min={-1} max={1} value={shape.bright} format={Format.signed} onChange={(v) => setControl("bright", v)} onCommit={replay} />
            <Slider label="Room" min={0} max={1} value={shape.room} format={Format.percent} onChange={(v) => setControl("room", v)} onCommit={replay} />
            <Slider label="Volume" min={-15} max={6} value={shape.gain} format={Format.decibels} onChange={(v) => setControl("gain", v)} onCommit={replay} />
          </div>
        </section>

        <nav className="sound-picker" aria-label="Sounds" onKeyDown={moveThroughGrid}>
          <h2>What is it for?</h2>
          <div className="choices">
            {SOUND_LIST.map((choice) => (
              <button
                type="button"
                key={choice.id}
                aria-current={choice.id === purpose}
                onClick={() => {
                  setPurpose(choice.id);
                  hear(soundOf(style, choice.id));
                }}
              >
                {choice.name}
                {shapes[shapeKey(style, choice.id)] !== undefined ? <i title="Changed" /> : null}
              </button>
            ))}
          </div>
        </nav>

        <div className="buttons centered">
          <button type="button" className="button primary" onClick={() => onCreateFrom(Draft.of(`My ${soundName.toLowerCase()}`, current.layers, current.room ?? 0))}>
            Edit in Create
          </button>
          <button type="button" className="button" onClick={() => save(current, `${style}-${purpose}`)}>
            WAV
          </button>
          {edited ? (
            <button type="button" className="link" onClick={reset}>
              Reset
            </button>
          ) : null}
        </div>

        <CodeBlock code={code} file="tactone.config.ts" onCopy={replay} />

        <form
          className="try card"
          ref={demo}
          aria-label={`Try ${preset?.name} on real controls`}
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <span>Try it</span>
          <button type="button" className="button">
            Button
          </button>
          <button type="submit" className="button">
            Submit
          </button>
          <a href="#/">Go to a page</a>
          <label>
            <input type="checkbox" /> Toggle
          </label>
          <Slider label="Slider" min={0} max={1} value={tryValue} format={Format.percent} onChange={setTryValue} onCommit={() => {}} />
          <select aria-label="Menu" defaultValue="Menu">
            <option>Menu</option>
            <option>Option</option>
            <option>Another</option>
          </select>
          <input type="text" placeholder="Type here" aria-label="Text field" />
        </form>
      </div>
      <Toast toast={toast} />
    </main>
  );
}

const subscribeToHash = (change: () => void) => {
  window.addEventListener("hashchange", change);
  return () => window.removeEventListener("hashchange", change);
};

function App() {
  const route = useSyncExternalStore(subscribeToHash, () => window.location.hash);
  const [draft, setDraft] = useState(FIRST_DRAFT);
  const creating = route === "#/create";

  return (
    <div className="app">
      <header className="bar">
        <a className="mark" href="#/">
          tactone
        </a>
        <nav aria-label="Pages">
          <a href="#/" aria-current={creating ? undefined : "page"}>
            Presets
          </a>
          <a href="#/create" aria-current={creating ? "page" : undefined}>
            Create
          </a>
        </nav>
      </header>
      {creating ? (
        <CreatePage draft={draft} onChange={setDraft} />
      ) : (
        <PresetsPage
          onCreateFrom={(next) => {
            setDraft(next);
            window.location.hash = "#/create";
          }}
        />
      )}
    </div>
  );
}

const root = document.getElementById("root");
if (root === null) throw new Error('The editor page has no #root element. Check editor/index.html still contains <div id="root">.');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
