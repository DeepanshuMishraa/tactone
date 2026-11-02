import { type ReactNode, StrictMode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { MOODS, SOUNDS } from "../editor/catalog.ts";
import type { Purpose, Style } from "../src/presets.ts";
import { useActiveSection, useReveal } from "./motion.ts";
import { Bar, Code, Command, Footer } from "./parts.tsx";
import { Preset, sounds } from "./preset.ts";
import "../editor/styles.css";
import "./site.css";

const SECTIONS = [
  { id: "install", title: "Install" },
  { id: "quick-start", title: "Quick start" },
  { id: "presets", title: "Presets" },
  { id: "play", title: "Play from code" },
  { id: "tweak", title: "Tweak a sound" },
  { id: "rules", title: "Rules" },
  { id: "attributes", title: "Attributes" },
  { id: "react", title: "React" },
  { id: "nextjs", title: "Next.js" },
  { id: "tanstack-start", title: "TanStack Start" },
  { id: "vanilla", title: "Without React" },
  { id: "scratch", title: "Build from scratch" },
  { id: "levels", title: "Levels" },
  { id: "browsers", title: "Browsers" },
  { id: "editor", title: "Editor" },
  { id: "skill", title: "Agent skill" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];
const SECTION_IDS = SECTIONS.map((section) => section.id);

const TRIGGERS = [
  ["click", "click, including Enter and Space on a button"],
  ["press", "Primary pointer down"],
  ["release", "Primary pointer up"],
  ["hover", "The mouse moving onto the element. Never touch, or a page swap under a still mouse"],
  ["focus", "Keyboard focus, using :focus-visible"],
  ["type", "Keys that edit text. Never password fields or shortcuts"],
  ["change", "change, such as checkboxes and selects"],
  ["slide", "Dragging a range input"],
] as const;

function Section({ id, children }: { readonly id: SectionId; readonly children: ReactNode }) {
  const title = SECTIONS.find((section) => section.id === id)?.title ?? id;
  return (
    <section className="doc" id={id} aria-labelledby={`${id}-title`} data-reveal>
      <h2 id={`${id}-title`}>
        <a href={`#${id}`}>{title}</a>
      </h2>
      {children}
    </section>
  );
}

/** Section links with one pill that slides to whichever section you're reading. */
function Toc() {
  const active = useActiveSection(SECTION_IDS);
  const nav = useRef<HTMLElement>(null);
  const [pill, setPill] = useState<{ readonly top: number; readonly height: number } | null>(null);

  useLayoutEffect(() => {
    const link = nav.current?.querySelector<HTMLAnchorElement>(`a[href="#${active}"]`);
    if (link === null || link === undefined) return;
    setPill({ top: link.offsetTop, height: link.offsetHeight });
  }, [active]);

  return (
    <nav className="toc" aria-label="On this page" ref={nav}>
      {pill === null ? null : <span className="toc-pill" style={{ transform: `translateY(${pill.top}px)`, height: pill.height }} aria-hidden="true" />}
      {SECTIONS.map((section) => (
        <a key={section.id} href={`#${section.id}`} aria-current={section.id === active ? "location" : undefined}>
          {section.title}
        </a>
      ))}
    </nav>
  );
}

/** Preset names you can press. Each one switches the site's sounds and plays its tap. */
function PresetPills({ styles }: { readonly styles: readonly { readonly id: Style; readonly name: string }[] }) {
  const current = Preset.use();
  return styles.map((style) => (
    <button
      type="button"
      className="pill"
      key={style.id}
      aria-current={style.id === current}
      aria-label={`Hear ${style.name}`}
      data-sound-click="none"
      onClick={() => {
        Preset.set(style.id);
        sounds.play("tap");
      }}
    >
      {style.id}
    </button>
  ));
}

/** Sound names you can press, played in whichever preset the site is on. */
function SoundPills({ items }: { readonly items: readonly { readonly id: Purpose; readonly name: string }[] }) {
  return items.map((item) => (
    <button type="button" className="pill" key={item.id} aria-label={`Hear ${item.name}`} data-sound-click="none" onClick={() => sounds.play(item.id)}>
      {item.id}
    </button>
  ));
}

function Docs() {
  useEffect(() => sounds.start(), []);
  useReveal();

  return (
    <div className="site">
      <div className="progress" aria-hidden="true" />
      <Bar page="docs" />
      <div className="docs">
        <Toc />

        <main className="doc-body">
          <header className="doc-intro">
            <h1 data-enter style={{ "--i": 0 }}>
              Docs
            </h1>
            <p className="lead" data-enter style={{ "--i": 1 }}>
              Everything you need to add Tactone to your app, from the first install to sounds you build yourself.
            </p>
          </header>

          <Section id="install">
            <p>Tactone works with React 18 or later, or with no framework at all. It has no runtime dependencies.</p>
            <Command command="npm i tactone" />
          </Section>

          <Section id="quick-start">
            <p>Pick a preset and wrap your app. Every button, link, checkbox, slider, select and text field under it now plays the right sound.</p>
            <Code
              file="root.tsx"
              code={`import { defaultRules, defineSounds } from "tactone";
import { SoundRoot } from "tactone/react";
import { glass } from "tactone/presets";

const config = defineSounds({ sounds: glass, rules: defaultRules });

export function Root() {
  return (
    <SoundRoot config={config}>
      <App />
    </SoundRoot>
  );
}`}
            />
          </Section>

          <Section id="presets">
            <p>
              There are 36 complete sets, grouped by mood. Import any of them from <code>tactone/presets</code>. Click one to hear it, and the whole site switches to it.
            </p>
            <div className="table card">
              <table>
                <thead>
                  <tr>
                    <th>Mood</th>
                    <th>Presets</th>
                  </tr>
                </thead>
                <tbody>
                  {MOODS.map((mood) => (
                    <tr key={mood.title}>
                      <td>{mood.title}</td>
                      <td>
                        <PresetPills styles={mood.styles} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>Each set has the same 19 sounds. Click one to hear it in the current preset.</p>
            <div className="table card">
              <table>
                <thead>
                  <tr>
                    <th>For</th>
                    <th>Sounds</th>
                  </tr>
                </thead>
                <tbody>
                  {SOUNDS.map((group) => (
                    <tr key={group.title}>
                      <td>{group.title}</td>
                      <td>
                        <SoundPills items={group.items} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>Each sound is plain data, so you can mix sets freely:</p>
            <Code code="const sounds = { ...felt, success: chime.success, error: glass.error };" />
          </Section>

          <Section id="play">
            <p>Play any sound by name. The name is checked against your config.</p>
            <Code
              code={`const sounds = useSounds<typeof config>();
sounds.play("success");`}
            />
          </Section>

          <Section id="tweak">
            <Code
              file="sounds.ts"
              code={`import { Sound } from "tactone";
import { glass } from "tactone/presets";

const sounds = {
  ...glass,
  tap: Sound.tweak(glass.tap, { pitch: -3, length: 1.4, bright: -0.3, gain: -2, room: 0.4 }),
};`}
            />
            <p>
              <code>pitch</code> is in semitones, <code>length</code> multiplies the ring time, <code>bright</code> runs from -1 to 1, <code>gain</code> is in decibels and{" "}
              <code>room</code> runs from 0 to 1.
            </p>
          </Section>

          <Section id="rules">
            <p>
              <code>defaultRules</code> is a list, so put your own rules ahead of it. The first match wins.
            </p>
            <Code
              code={`const config = defineSounds({
  sounds: glass,
  rules: [
    { match: ".danger", on: "click", play: "remove" },
    { match: "[role=row]", on: "hover", play: "hover", volume: 0.5 },
    ...defaultRules,
  ],
});`}
            />
            <p>A rule that plays a sound your set doesn't have is a type error.</p>
            <div className="table card">
              <table>
                <thead>
                  <tr>
                    <th>Trigger</th>
                    <th>Fires on</th>
                  </tr>
                </thead>
                <tbody>
                  {TRIGGERS.map(([trigger, fires]) => (
                    <tr key={trigger}>
                      <td>
                        <code>{trigger}</code>
                      </td>
                      <td>{fires}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Rules also take <code>volume</code>, <code>pitch</code> (a number, or a function of the element) and <code>throttle</code> in milliseconds. Hover defaults to 60 ms,
              typing to 40 ms and sliding to 45 ms.
            </p>
          </Section>

          <Section id="attributes">
            <p>Attributes beat rules, which makes them good for one-off exceptions. Disabled controls stay silent.</p>
            <Code
              file="page.html"
              code={`<button data-sound="success">Plays success on click</button>
<a data-sound-hover="tap">Plays tap on hover</a>
<section data-sound="none">Everything in here is silent</section>`}
            />
          </Section>

          <Section id="react">
            <p>
              In a client-rendered app, such as one made with Vite, wrap the tree where you mount it. Define the config at module level so it keeps the same reference on every
              render.
            </p>
            <Code
              file="src/main.tsx"
              code={`import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { defaultRules, defineSounds } from "tactone";
import { SoundRoot } from "tactone/react";
import { glass } from "tactone/presets";
import { App } from "./App";

const config = defineSounds({ sounds: glass, rules: defaultRules });

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <SoundRoot config={config}>
      <App />
    </SoundRoot>
  </StrictMode>,
);`}
            />
          </Section>

          <Section id="nextjs">
            <p>
              <code>defaultRules</code> contains functions, and React can't pass functions from a server component to a client component. Define the config in a client component,
              then use that component in your layout.
            </p>
            <Code
              file="app/sounds.tsx"
              code={`"use client";

import { defaultRules, defineSounds } from "tactone";
import { SoundRoot } from "tactone/react";
import { glass } from "tactone/presets";
import type { ReactNode } from "react";

const config = defineSounds({ sounds: glass, rules: defaultRules });

export function Sounds({ children }: { children: ReactNode }) {
  return <SoundRoot config={config}>{children}</SoundRoot>;
}`}
            />
          </Section>

          <Section id="tanstack-start">
            <p>
              Wrap the <code>Outlet</code> in your root route. There are no server components, so the config can live in the same file. <code>SoundRoot</code> renders on the server
              and only starts listening once the page hydrates.
            </p>
            <Code
              file="src/routes/__root.tsx"
              code={`import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { defaultRules, defineSounds } from "tactone";
import { SoundRoot } from "tactone/react";
import { glass } from "tactone/presets";

const config = defineSounds({ sounds: glass, rules: defaultRules });

export const Route = createRootRoute({ component: RootComponent });

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <SoundRoot config={config}>
          <Outlet />
        </SoundRoot>
        <Scripts />
      </body>
    </html>
  );
}`}
            />
          </Section>

          <Section id="vanilla">
            <p>The core has no framework in it.</p>
            <Code
              code={`import { createSounds, defaultRules } from "tactone";
import { glass } from "tactone/presets";

const sounds = createSounds({ sounds: glass, rules: defaultRules });
const stop = sounds.start();
sounds.play("success");`}
            />
          </Section>

          <Section id="scratch">
            <p>A sound is an object of tone and noise layers. Write one by hand, or save it as JSON.</p>
            <Code
              code={`import { GLASS, Levels, Sound, strike } from "tactone";

const chord = Sound.of(
  [...strike(880, 0.4, 0.6, GLASS), ...strike(1320, 0.5, 0.5, GLASS, { offset: 0.08 })],
  { room: 0.4 },
);

// Match it to the rest of the palette.
const balanced = Levels.normalize(chord, -23);`}
            />
            <p>
              <code>Sound.parse(json)</code> validates data from outside your code and returns <code>{"{ ok: true, sound }"}</code> or <code>{"{ ok: false, problems }"}</code>.
            </p>
          </Section>

          <Section id="levels">
            <p>
              Presets sit in three loudness tiers: frequent feedback at -30 dB, actions at -23 dB and results at -19 dB. A test holds all 684 sounds to them. Measure your own with{" "}
              <code>Levels.of(sound)</code>.
            </p>
          </Section>

          <Section id="browsers">
            <ul>
              <li>
                Audio starts on the first gesture. Call <code>sounds.unlock()</code> yourself if you need the result.
              </li>
              <li>Sounds asked for while audio wakes up collapse to the latest one. If it waited over 250 ms it's dropped, since it would land detached from its cause.</li>
              <li>After 20 seconds of quiet the audio context suspends, so Safari releases the audio device.</li>
              <li>
                During server rendering nothing happens. <code>createSounds</code> touches no browser API until <code>start</code> or <code>play</code>.
              </li>
              <li>
                Your app owns preferences. <code>setVolume</code> and <code>setMuted</code> apply a setting, and Tactone stores nothing.
              </li>
            </ul>
          </Section>

          <Section id="editor">
            <p>Audition all 36 presets, shape any sound with sliders or build one from scratch, then copy the config.</p>
            <Command command="npx tactone editor" />
          </Section>

          <Section id="skill">
            <p>The package includes a skill that helps coding agents work with Tactone. Installing the package doesn't touch your home directory. To add the skill, run:</p>
            <Command command="npx tactone skill" />
            <p>
              This copies it to <code>~/.agents/skills/tactone</code>, replacing any copy already there.
            </p>
            <p>
              Agents working on your app can also read{" "}
              <a className="inline-link" href="/agents.md">
                /agents.md
              </a>
              , a plain-markdown guide to adding Tactone correctly.
            </p>
          </Section>
        </main>
      </div>
      <Footer />
    </div>
  );
}

const root = document.getElementById("root");
if (root === null) throw new Error('The docs page has no #root element. Check site/docs/index.html still contains <div id="root">.');
createRoot(root).render(
  <StrictMode>
    <Docs />
  </StrictMode>,
);
