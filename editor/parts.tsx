/** The small pieces both pages share. */

import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TextMorph } from "torph/react";
import { defaultRules } from "../src/defaults.ts";
import { RENDER_RATE, render } from "../src/render.ts";
import type { Sound } from "../src/sound.ts";
import { createSounds } from "../src/sounds.ts";
import { Code } from "./code.ts";
import { highlight } from "./highlight.ts";

declare module "react" {
  interface CSSProperties {
    "--length"?: string;
    "--at"?: string;
  }
}

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/**
 * Text that changes meaning morphs into its new wording. Every use shares one
 * timing, so the motion reads as one system. It renders inline-block, so put it
 * inside the h1 or p it belongs to, which keeps that element's own block layout.
 */
export function Morph({ children }: { readonly children: string }) {
  return (
    <TextMorph duration={340} ease="cubic-bezier(0.22, 1, 0.36, 1)" respectReducedMotion>
      {children}
    </TextMorph>
  );
}

/** Positions along a slider. Fine enough to feel continuous, and arrow keys move one at a time. */
const STEPS = 200;

type SliderProps = {
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly value: number;
  readonly scale?: "linear" | "log";
  readonly format: (value: number) => string;
  readonly onChange: (value: number) => void;
  readonly onCommit: () => void;
};

/**
 * A raised pane sliding inside a recessed trough, with the name and reading
 * written across both. An invisible native range input lies over it, which
 * supplies dragging, touch, keyboard and screen reader support, and fires the
 * real `input` event that Tactone's own `slide` rule listens for.
 */
export function Slider({ label, min, max, value, scale = "linear", format, onChange, onCommit }: SliderProps) {
  const toPosition = (v: number) => (scale === "log" ? Math.log(v / min) / Math.log(max / min) : (v - min) / (max - min));
  const fromPosition = (p: number) => (scale === "log" ? min * (max / min) ** p : min + p * (max - min));
  const position = clamp(toPosition(value), 0, 1);

  return (
    <div className="slider" style={{ "--at": position.toFixed(4) }}>
      <span className="fill" />
      <span className="name">{label}</span>
      <output className="reading">{format(value)}</output>
      <input
        type="range"
        aria-label={label}
        aria-valuetext={format(value)}
        min={0}
        max={STEPS}
        value={Math.round(position * STEPS)}
        onChange={(event) => onChange(fromPosition(Number(event.target.value) / STEPS))}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
      />
    </div>
  );
}

function wavePath(samples: Float32Array, width: number, height: number) {
  const perColumn = Math.max(1, samples.length / width);
  const middle = height / 2;
  let peak = 0.0001;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  let top = "";
  let bottom = "";
  for (let column = 0; column < width; column += 1) {
    let [low, high] = [0, 0];
    const end = Math.floor((column + 1) * perColumn);
    for (let index = Math.floor(column * perColumn); index < end && index < samples.length; index += 1) {
      const sample = (samples[index] ?? 0) / peak;
      low = Math.min(low, sample);
      high = Math.max(high, sample);
    }
    top += `${column === 0 ? "M" : "L"}${column} ${(middle - high * middle * 0.95).toFixed(1)}`;
    bottom = `L${column} ${(middle - low * middle * 0.95).toFixed(1)}${bottom}`;
  }
  return `${top}${bottom}Z`;
}

/** The sound's shape. A hairline crosses it for exactly as long as the sound plays. */
export function Wave({ sound, plays }: { readonly sound: Sound; readonly plays: number }) {
  const samples = useMemo(() => render(sound), [sound]);
  const path = useMemo(() => wavePath(samples, 480, 72), [samples]);
  return (
    <div className="wave">
      <svg viewBox="0 0 480 72" preserveAspectRatio="none" role="img" aria-label="The shape of this sound">
        <path d={path} />
      </svg>
      {plays > 0 ? <i key={plays} style={{ "--length": `${(samples.length / RENDER_RATE).toFixed(3)}s` }} /> : null}
    </div>
  );
}

/** The button directly above or below, in whichever row is nearest. */
function buttonInNextRow(buttons: readonly HTMLButtonElement[], from: HTMLButtonElement, direction: "up" | "down") {
  const box = from.getBoundingClientRect();
  const gapTo = (rect: DOMRect) => (direction === "down" ? rect.top - box.bottom : box.top - rect.bottom);
  const ahead = buttons.map((button) => ({ button, rect: button.getBoundingClientRect() })).filter(({ rect }) => gapTo(rect) >= 0);
  const nearest = Math.min(...ahead.map(({ rect }) => gapTo(rect)));
  const row = ahead.filter(({ rect }) => gapTo(rect) === nearest);
  return row.reduce<(typeof row)[number] | undefined>(
    (best, item) => (best === undefined || Math.abs(item.rect.left - box.left) < Math.abs(best.rect.left - box.left) ? item : best),
    undefined,
  )?.button;
}

/** Arrow keys move around the grid and play as they land, so auditioning needs no mouse. */
export function moveThroughGrid(event: KeyboardEvent<HTMLElement>) {
  const buttons = [...event.currentTarget.querySelectorAll("button")];
  const focused = document.activeElement;
  if (!(focused instanceof HTMLButtonElement) || !buttons.includes(focused)) return;
  const next =
    event.key === "ArrowRight"
      ? buttons[buttons.indexOf(focused) + 1]
      : event.key === "ArrowLeft"
        ? buttons[buttons.indexOf(focused) - 1]
        : event.key === "ArrowDown"
          ? buttonInNextRow(buttons, focused, "down")
          : event.key === "ArrowUp"
            ? buttonInNextRow(buttons, focused, "up")
            : undefined;
  if (next === undefined) return;
  event.preventDefault();
  next.focus();
  next.click();
}

/** Space plays the current sound, unless focus is on something Space already operates. */
export function useSpaceToPlay(play: () => void) {
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) return;
      if (event.target instanceof Element && event.target.closest("input, textarea, select, button, a, summary") !== null) return;
      event.preventDefault();
      play();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [play]);
}

export function downloadWav(sound: Sound, name: string) {
  const url = URL.createObjectURL(Code.wav(sound));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.wav`;
  link.click();
  URL.revokeObjectURL(url);
}

/** The one audio connection both pages share. */
export const audio = createSounds<string>({ sounds: {} });

/** Dragging a slider plays the sound at most this often, so changes are heard without a machine-gun effect. */
const PREVIEW_GAP_MS = 130;

/**
 * Plays a sound now, and limits repeat plays while a slider is moving. `set` is
 * whatever the page's real controls should keep playing alongside the preview.
 */
export function useAudition(set: Readonly<Record<string, Sound>>) {
  const last = useRef(0);
  const live = useRef(set);
  live.current = set;
  const [plays, setPlays] = useState(0);
  const hear = useCallback((sound: Sound) => {
    audio.configure({ sounds: { ...live.current, preview: sound }, rules: defaultRules });
    audio.play("preview");
    last.current = performance.now();
    setPlays((count) => count + 1);
  }, []);
  const hearSoon = useCallback(
    (sound: Sound) => {
      if (performance.now() - last.current >= PREVIEW_GAP_MS) hear(sound);
    },
    [hear],
  );
  return { hear, hearSoon, plays };
}

export function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return { copied, copy };
}

/** A raised panel with its name and Copy on top, and highlighted code sunk into a well below. */
export function CodeBlock({ code, file, onCopy }: { readonly code: string; readonly file: string; readonly onCopy: () => void }) {
  const [open, setOpen] = useState(false);
  const { copied, copy } = useCopy();
  const lines = code.replace(/\n$/, "").split("\n");
  return (
    <section className="codeblock card" aria-label="Code" data-open={open || undefined}>
      <header>
        <button type="button" className="code-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path d="M4.5 2.5 8 6l-3.5 3.5" />
          </svg>
          <Morph>{open ? file : "See the code"}</Morph>
        </button>
        <button
          type="button"
          className="button code-copy"
          onClick={() => {
            onCopy();
            void copy(code);
          }}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            {copied ? (
              <path d="m3.5 8.5 3 3 6-7" />
            ) : (
              <>
                <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
                <path d="M10.5 3.5v-.5A1.5 1.5 0 0 0 9 1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5" />
              </>
            )}
          </svg>
          <Morph>{copied ? "Copied" : "Copy"}</Morph>
        </button>
      </header>
      <div className="code-reveal" inert={!open}>
        <div>
          <pre>
            <code>
              {lines.map((line, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: generated lines have no identity beyond their position.
                <span className="line" key={index}>
                  {highlight(line).map((token, at) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: tokens are rebuilt from the text on every render.
                    <span className={`token-${token.kind}`} key={at}>
                      {token.text}
                    </span>
                  ))}
                  {"\n"}
                </span>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
}

export const Format = {
  semitones: (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(1)}`,
  times: (value: number) => `${value.toFixed(2)}×`,
  signed: (value: number) => `${value > 0 ? "+" : ""}${Math.round(value * 100)}`,
  percent: (value: number) => `${Math.round(value * 100)}%`,
  decibels: (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(1)} dB`,
} as const;
