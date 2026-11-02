import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { MOODS, PRESET_LIST, SOUND_LIST } from "../editor/catalog.ts";
import { Format, Morph, moveThroughGrid, Slider, Wave } from "../editor/parts.tsx";
import { type Purpose, sets } from "../src/presets.ts";
import { useReveal } from "./motion.ts";
import { Arrow, Bar, Code, Command, Footer } from "./parts.tsx";
import { Preset, sounds } from "./preset.ts";
import "../editor/styles.css";
import "./site.css";

const QUICK_START = `import { defaultRules, defineSounds } from "tactone";
import { SoundRoot } from "tactone/react";
import { glass } from "tactone/presets";

const config = defineSounds({ sounds: glass, rules: defaultRules });

export function Root() {
  return (
    <SoundRoot config={config}>
      <App />
    </SoundRoot>
  );
}`;

const MIX = `import { Sound } from "tactone";
import { chime, felt, glass } from "tactone/presets";

const sounds = {
  ...felt,
  success: chime.success,
  error: glass.error,
  tap: Sound.tweak(felt.tap, { pitch: -3, length: 1.4, room: 0.4 }),
};`;

const STEPS = [
  { title: "Pick a preset", body: "Choose one of 36 sets, from soft felt to 8-bit chips. Each one has the same 19 sounds." },
  { title: "Wrap your app", body: "Put SoundRoot at the top. Your buttons, links, toggles, sliders, menus and text fields start playing." },
  { title: "Make it yours", body: "Tweak any sound, mix sets, or add your own rules. The editor writes the code for you." },
] as const;

const POINTS = [
  { title: "Nothing to download", body: "Your sounds are synthesized live with Web Audio. You ship no audio files and no runtime dependencies." },
  { title: "Never too loud", body: "Every preset sits in the same three loudness tiers, and a test holds all 684 sounds to them. Switching sets never needs a re-mix." },
  { title: "Zero wiring", body: "defaultRules listens for real interactions, so you never add an onClick for sound. Disabled controls and password fields stay silent." },
  { title: "Typos fail the build", body: "A rule that plays a sound your set doesn't have is a type error, so you catch it in your editor instead of in production." },
] as const;

/** The page's own sounds come from here, so choosing a preset changes every control on the page. */
function Picker() {
  const style = Preset.use();
  const [purpose, setPurpose] = useState<Purpose>("tap");
  const [plays, setPlays] = useState(0);
  const [level, setLevel] = useState(0.5);
  const mood = MOODS.find((item) => item.styles.some((choice) => choice.id === style));
  const preset = PRESET_LIST.find((item) => item.id === style);
  const soundName = SOUND_LIST.find((item) => item.id === purpose)?.name ?? purpose;

  const hear = (next: Purpose) => {
    sounds.play(next);
    setPlays((count) => count + 1);
  };

  return (
    <section className="picker" aria-label="Pick a preset" data-reveal>
      <div className="browser">
        <nav className="moods" aria-label="Moods" data-sound-click="none" onKeyDown={moveThroughGrid}>
          {MOODS.map((item) => (
            <button
              type="button"
              key={item.title}
              aria-current={item === mood}
              onClick={() => {
                const first = item.styles[0];
                if (first === undefined) return;
                Preset.set(first.id);
                hear(purpose);
              }}
            >
              {item.title}
            </button>
          ))}
        </nav>

        {/* The picker plays its own sound on click, so only hover is left to the page rules and nothing plays twice. */}
        <div className="presets card" data-sound-click="none">
          <nav className="preset-grid" aria-label="Presets" onKeyDown={moveThroughGrid}>
            {mood?.styles.map((choice) => (
              <button
                type="button"
                key={choice.id}
                aria-current={choice.id === style}
                onClick={() => {
                  Preset.set(choice.id);
                  hear(purpose);
                }}
              >
                {choice.name}
              </button>
            ))}
          </nav>

          <div className="picker-sound">
            <div>
              <h2 className="picker-name">
                <Morph>{preset?.name ?? style}</Morph>
              </h2>
              <p className="hint">
                <Morph>{preset?.hint ?? ""}</Morph>
              </p>
            </div>
            <button type="button" className="play" onClick={() => hear(purpose)}>
              <Morph>{`Play ${soundName.toLowerCase()}`}</Morph>
            </button>
          </div>
          <Wave sound={sets[style][purpose]} plays={plays} />

          <nav className="choices" aria-label="Sounds" onKeyDown={moveThroughGrid}>
            {SOUND_LIST.map((choice) => (
              <button
                type="button"
                key={choice.id}
                aria-current={choice.id === purpose}
                onClick={() => {
                  setPurpose(choice.id);
                  hear(choice.id);
                }}
              >
                {choice.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* These controls carry no sound code at all. defaultRules hears them, which is the point. */}
      <form className="try card" aria-label="Try it on real controls" onSubmit={(event) => event.preventDefault()}>
        <span>Try it</span>
        <button type="button" className="button">
          Button
        </button>
        <button type="submit" className="button">
          Submit
        </button>
        <label>
          <input type="checkbox" /> Toggle
        </label>
        <Slider label="Slider" min={0} max={1} value={level} format={Format.percent} onChange={setLevel} onCommit={() => {}} />
        <input type="text" placeholder="Type here" aria-label="Text field" />
      </form>
    </section>
  );
}

function Home() {
  useEffect(() => sounds.start(), []);
  useReveal();

  return (
    <div className="site">
      <Bar page="home" />
      <main className="home">
        <section className="hero">
          <h1 data-enter style={{ "--i": 0 }}>
            Sound for every click, toggle and keystroke in your app.
          </h1>
          <p className="lead" data-enter style={{ "--i": 1 }}>
            Pick one of 36 presets and wrap your app. Tactone synthesizes each sound live in the browser, so you ship no audio files and no dependencies.
          </p>
          <div className="hero-actions" data-enter style={{ "--i": 2 }}>
            <a className="button primary cta" href="/docs/">
              Get started <Arrow />
            </a>
            <Command command="npm i tactone" />
          </div>
          <p className="aside" data-enter style={{ "--i": 3 }}>
            This page has sound. Pick a preset below, then press anything.
          </p>
        </section>

        <Picker />

        <section className="section" data-reveal>
          <h2 className="eyebrow">The problem</h2>
          <h3 className="title">Adding sound is usually a chore.</h3>
          <p className="lead">
            You find files, trim them, balance their levels and wire a handler into every component. Tactone does all four, so the whole job fits in three lines.
          </p>
        </section>

        <section className="section" data-reveal>
          <h2 className="eyebrow">How it works</h2>
          <ol className="steps">
            {STEPS.map((step, index) => (
              <li className="point card" key={step.title} style={{ "--i": index }}>
                <b>{index + 1}</b>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
          <Code code={QUICK_START} file="root.tsx" />
        </section>

        <section className="section" data-reveal>
          <h2 className="eyebrow">What you get</h2>
          <div className="points">
            {POINTS.map((point, index) => (
              <article className="point card" key={point.title} style={{ "--i": index }}>
                <h3>{point.title}</h3>
                <p>{point.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" data-reveal>
          <h2 className="eyebrow">Make it yours</h2>
          <h3 className="title">Every sound is plain data.</h3>
          <p className="lead">Mix sets freely, then change pitch, length, brightness, room and volume on any single sound.</p>
          <Code code={MIX} file="sounds.ts" />
        </section>

        <section className="section" data-reveal>
          <h2 className="eyebrow">Editor</h2>
          <h3 className="title">Hear all 684 before you choose.</h3>
          <p className="lead">The editor plays every preset, lets you shape any sound with sliders or build one from scratch, then writes the config for you.</p>
          <Command command="npx tactone editor" />
        </section>

        <section className="section closing" data-reveal>
          <h3 className="title">Add sound to your app in a minute.</h3>
          <div className="hero-actions">
            <a className="button primary cta" href="/docs/">
              Get started <Arrow />
            </a>
            <Command command="npm i tactone" />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

const root = document.getElementById("root");
if (root === null) throw new Error('The landing page has no #root element. Check site/index.html still contains <div id="root">.');
createRoot(root).render(
  <StrictMode>
    <Home />
  </StrictMode>,
);
