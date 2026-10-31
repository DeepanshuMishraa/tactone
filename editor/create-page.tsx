/**
 * Making a sound from scratch, laid out as a path a beginner can simply walk
 * down: start from something close, shape it, optionally stack more on top. The
 * result stays beside them the whole way, always one click from being heard.
 */

import { useCallback, useMemo, useState } from "react";
import type { Layer, Sound } from "../src/sound.ts";
import { Code } from "./code.ts";
import { ADDITIONS, Draft, FEELS, identifier, Library, Part, RECIPES, type Saved, type Shape, surprise } from "./create.ts";
import { CodeBlock, downloadWav, Format, Morph, Slider, useAudition, useCopy, useSpaceToPlay, Wave } from "./parts.tsx";

const NO_SOUNDS: Readonly<Record<string, Sound>> = {};

type Props = { readonly draft: Draft; readonly onChange: (draft: Draft) => void };

export function CreatePage({ draft, onChange }: Props) {
  const [saved, setSaved] = useState(Library.load);
  const [notice, setNotice] = useState("");
  const { hear, hearSoon, plays } = useAudition(NO_SOUNDS);
  const { copied, copy } = useCopy();

  const sound = useMemo(() => Draft.sound(draft), [draft]);
  const replay = useCallback(() => hear(sound), [hear, sound]);
  useSpaceToPlay(replay);

  const start = (next: Draft) => {
    onChange(next);
    setNotice("");
    hear(Draft.sound(next));
  };
  /** A slider move: heard while dragging, but not on every single frame. */
  const drag = (next: Draft) => {
    onChange(next);
    hearSoon(Draft.sound(next));
  };
  /** A click: always heard at once. */
  const set = (next: Draft) => {
    onChange(next);
    hear(Draft.sound(next));
  };

  const setShape = (id: keyof Shape, value: number) => drag({ ...draft, shape: { ...draft.shape, [id]: value } });
  const dragLayer = (index: number, change: (layer: Layer) => Layer) => drag({ ...draft, parts: draft.parts.map((layer, at) => (at === index ? change(layer) : layer)) });

  const persist = (next: readonly Saved[], message: string) => {
    setSaved(next);
    setNotice(Library.store(next) ? message : "Couldn't save, because this browser is blocking storage. Copy the code to keep your sound.");
  };

  const code = Code.sound(identifier(draft.name), sound);
  const main = draft.parts[0];

  return (
    <div className="create">
      <div className="path">
        <section className="card">
          <h2>
            <b>1</b> Start with something close
          </h2>
          <p className="lead">Click any of these to hear it. Pick whichever is nearest to what you want.</p>
          <div className="tiles">
            {RECIPES.map((recipe) => (
              <button
                type="button"
                className="tile"
                key={recipe.name}
                aria-pressed={draft.start.parts === recipe.parts}
                onClick={() => start({ ...Draft.of(draft.name, recipe.parts, recipe.room) })}
              >
                <strong>{recipe.name}</strong>
                <small>{recipe.hint}</small>
              </button>
            ))}
            <button
              type="button"
              className="tile"
              onClick={() => {
                const made = surprise(Math.random);
                start(Draft.of(draft.name, made.parts, made.room));
              }}
            >
              <strong>Surprise me</strong>
              <small>Something random</small>
            </button>
          </div>
        </section>

        <section className="card">
          <div className="heading">
            <h2>
              <b>2</b> Shape it
            </h2>
            {Draft.isChanged(draft) ? (
              <button type="button" className="link" onClick={() => start(Draft.of(draft.name, draft.start.parts, draft.start.room))}>
                Start over
              </button>
            ) : null}
          </div>
          <p className="lead">Drag a slider and you'll hear the change straight away. You can't break anything.</p>

          {main === undefined ? null : (
            <>
              <h3>What does it sound like?</h3>
              <fieldset className="segments" aria-label="What the sound is like">
                {FEELS.map((feel) => (
                  <button
                    type="button"
                    key={feel.source}
                    title={feel.hint}
                    aria-pressed={Part.source(main) === feel.source}
                    onClick={() => set({ ...draft, parts: draft.parts.map((layer, at) => (at === 0 ? Part.setSource(layer, feel.source) : layer)) })}
                  >
                    {feel.name}
                  </button>
                ))}
              </fieldset>
              <p className="note">
                <Morph>{`${FEELS.find((feel) => feel.source === Part.source(main))?.hint ?? ""}.`}</Morph>
              </p>
            </>
          )}

          <h3>Adjust it</h3>
          <div className="sliders">
            <Slider label="Pitch" min={-24} max={24} value={draft.shape.pitch} format={Format.semitones} onChange={(v) => setShape("pitch", v)} onCommit={replay} />
            <Slider label="Length" min={0.25} max={4} scale="log" value={draft.shape.length} format={Format.times} onChange={(v) => setShape("length", v)} onCommit={replay} />
            <Slider label="Brightness" min={-1} max={1} value={draft.shape.bright} format={Format.signed} onChange={(v) => setShape("bright", v)} onCommit={replay} />
            <Slider label="Soft start" min={0.25} max={32} scale="log" value={draft.shape.attack} format={Format.times} onChange={(v) => setShape("attack", v)} onCommit={replay} />
            <Slider label="Pitch slide" min={-24} max={24} value={draft.shape.bend} format={Format.semitones} onChange={(v) => setShape("bend", v)} onCommit={replay} />
            <Slider label="Room" min={0} max={1} value={draft.room} format={Format.percent} onChange={(v) => drag({ ...draft, room: v })} onCommit={replay} />
            <Slider label="Volume" min={-15} max={6} value={draft.volume} format={Format.decibels} onChange={(v) => drag({ ...draft, volume: v })} onCommit={replay} />
          </div>
        </section>

        <section className="card">
          <h2>
            <b>3</b> Add more <span className="optional">Optional</span>
          </h2>
          <p className="lead">Stack another sound on top to make yours richer. Most good sounds use two or three.</p>
          <div className="tiles">
            {ADDITIONS.map((addition) => (
              <button type="button" className="tile" key={addition.name} onClick={() => set({ ...draft, parts: [...draft.parts, addition.layer] })}>
                <strong>+ {addition.name}</strong>
                <small>{addition.hint}</small>
              </button>
            ))}
          </div>

          {draft.parts.length > 1 ? (
            <ol className="layers">
              {draft.parts.map((layer, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: layers are plain data with no ids, and a row's position is its identity.
                <li className="layer" key={index}>
                  <div className="heading">
                    <h3>{index === 0 ? "Main sound" : `Layer ${index + 1}`}</h3>
                    <button type="button" className="link" onClick={() => set({ ...draft, parts: draft.parts.filter((_, at) => at !== index) })}>
                      Remove
                    </button>
                  </div>
                  <div className="sliders">
                    <Slider
                      label="Strength"
                      min={0}
                      max={1}
                      value={layer.peak}
                      format={Format.percent}
                      onChange={(v) => dragLayer(index, (l) => ({ ...l, peak: v }))}
                      onCommit={replay}
                    />
                    <Slider
                      label="Delay"
                      min={0}
                      max={0.5}
                      value={layer.offset ?? 0}
                      format={(v) => `${Math.round(v * 1000)} ms`}
                      onChange={(v) => dragLayer(index, (l) => ({ ...l, offset: v }))}
                      onCommit={replay}
                    />
                  </div>
                  <details>
                    <summary>More controls</summary>
                    <div className="sliders">
                      <Slider
                        label="Pitch"
                        min={40}
                        max={8000}
                        scale="log"
                        value={layer.frequency}
                        format={(v) => `${Math.round(v)} Hz`}
                        onChange={(v) => dragLayer(index, (l) => Part.setPitch(l, v))}
                        onCommit={replay}
                      />
                      <Slider
                        label="Length"
                        min={0.01}
                        max={1.5}
                        scale="log"
                        value={layer.decay}
                        format={(v) => `${Math.round(v * 1000)} ms`}
                        onChange={(v) => dragLayer(index, (l) => ({ ...l, decay: v }))}
                        onCommit={replay}
                      />
                    </div>
                  </details>
                </li>
              ))}
            </ol>
          ) : null}
        </section>
      </div>

      <aside className="result card">
        <label className="field">
          <span>Name your sound</span>
          <input value={draft.name} onChange={(event) => onChange({ ...draft, name: event.target.value })} />
        </label>

        <button type="button" className="play big" onClick={replay} disabled={draft.parts.length === 0}>
          Play <kbd>space</kbd>
        </button>

        <Wave sound={sound} plays={plays} />

        {draft.parts.length === 0 ? <p className="note">Nothing here yet. Pick a starting point in step 1.</p> : null}

        <h3>Happy with it?</h3>
        <div className="buttons">
          <button
            type="button"
            className="button primary"
            disabled={draft.parts.length === 0}
            onClick={() => persist([...saved.filter((item) => item.name !== draft.name), Draft.saved(draft)], `Saved "${draft.name}" in this browser.`)}
          >
            Save
          </button>
          <button
            type="button"
            className="button"
            onClick={() => {
              replay();
              void copy(code);
            }}
          >
            <Morph>{copied ? "Copied" : "Copy code"}</Morph>
          </button>
          <button type="button" className="button" onClick={() => downloadWav(sound, identifier(draft.name))}>
            WAV
          </button>
        </div>
        {notice === "" ? null : (
          <p className="note" role="status">
            <Morph>{notice}</Morph>
          </p>
        )}

        <CodeBlock code={code} file={`${identifier(draft.name)}.ts`} onCopy={replay} />

        <h3>Your sounds</h3>
        {saved.length === 0 ? <p className="note">Sounds you save will appear here.</p> : null}
        <ul className="saved">
          {saved.map((item) => (
            <li key={item.name}>
              <button type="button" onClick={() => start(Draft.of(item.name, item.parts, item.room, item.volume))}>
                {item.name}
              </button>
              <button
                type="button"
                className="link"
                aria-label={`Delete ${item.name}`}
                onClick={() =>
                  persist(
                    saved.filter((other) => other.name !== item.name),
                    `Deleted "${item.name}".`,
                  )
                }
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
