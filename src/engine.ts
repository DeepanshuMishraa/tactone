/**
 * Playback state and the browser's audio lifecycle. The context can be
 * suspended, interrupted or locked at any moment, and a sound asked for then
 * must neither vanish without reason nor arrive late and stacked on others.
 */

import { type Bus, createBus } from "./driver.ts";
import { Sound } from "./sound.ts";

/** Scheduled this far ahead, so the first buffer after waking cannot cut off the attack. */
const LOOKAHEAD = 0.006;
/** A sound still waiting after this long would land detached from what caused it, so it is dropped. */
const STALE_MS = 250;
/** The same sound asked for inside this window is one sound, not two summed to double the level. */
const DOUBLE_HIT = 0.02;
/** After this much quiet the context suspends, so Safari releases the audio device. */
const IDLE_MS = 20_000;
const WAKE_LIMIT_MS = 1000;

/** The parts of a running audio context the engine needs. Tests supply a fake. */
export type Port = {
  readonly state: () => AudioContextState | "interrupted";
  readonly now: () => number;
  readonly resume: () => Promise<void>;
  readonly suspend: () => Promise<void>;
  /** Plays one silent sample, which iOS requires inside a gesture before it allows audio. */
  readonly prime: () => void;
  readonly bus: Pick<Bus, "play" | "silence" | "setLevel">;
};

export type Engine = {
  readonly play: (sound: Sound) => void;
  /** Call inside a user gesture. Resolves to whether audio can now play. Never rejects. */
  readonly unlock: () => Promise<boolean>;
  readonly setVolume: (volume: number) => void;
  readonly setMuted: (muted: boolean) => void;
  readonly dispose: () => void;
};

export function webPort(): Port | null {
  if (typeof AudioContext === "undefined") return null;
  const context = new AudioContext({ latencyHint: "interactive" });
  const bus = createBus(context);
  return {
    // Safari also reports "interrupted" here after a call or a tab switch; the DOM types omit it.
    state: () => context.state,
    now: () => context.currentTime,
    resume: () => context.resume(),
    suspend: () => context.suspend(),
    prime: () => {
      const source = context.createBufferSource();
      source.buffer = context.createBuffer(1, 1, context.sampleRate);
      source.connect(context.destination);
      source.start();
    },
    bus,
  };
}

const volumeOf = (value: number, fallback: number) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback);

export type EngineOptions = {
  readonly volume?: number;
  readonly muted?: boolean;
  /** Creates the audio port on first need. Returning null means no audio here, such as during SSR. */
  readonly connect?: () => Port | null;
  readonly random?: () => number;
  readonly onError?: (error: Error) => void;
};

export function createEngine(options: EngineOptions = {}): Engine {
  const connect = options.connect ?? webPort;
  const random = options.random ?? Math.random;

  let port: Port | null = null;
  let volume = volumeOf(options.volume ?? 1, 1);
  let muted = options.muted ?? false;
  let pending: { readonly sound: Sound; readonly askedAt: number } | null = null;
  let waking: Promise<boolean> | null = null;
  let idle: ReturnType<typeof setTimeout> | undefined;
  let last: { readonly sound: Sound; readonly at: number } | null = null;

  const ensurePort = () => {
    if (port !== null) return port;
    port = connect();
    port?.bus.setLevel(volume);
    return port;
  };

  const armIdle = (active: Port, seconds: number) => {
    clearTimeout(idle);
    idle = setTimeout(
      () => {
        if (active.state() === "running") {
          active.suspend().catch(() => {
            // Staying awake only costs battery. The next play still works, so there is nothing to report.
          });
        }
      },
      IDLE_MS + seconds * 1000,
    );
  };

  const start = (active: Port, sound: Sound) => {
    const now = active.now();
    if (last !== null && last.sound === sound && now - last.at < DOUBLE_HIT) return;
    last = { sound, at: now };
    active.bus.play(Sound.humanize(sound, random), now + LOOKAHEAD);
    armIdle(active, Sound.duration(sound));
  };

  const wake = (active: Port): Promise<boolean> => {
    if (waking !== null) return waking;
    // Safari can leave resume() unsettled outside a gesture. Without this limit, that would block every later try.
    const limit = new Promise<void>((resolve) => setTimeout(resolve, WAKE_LIMIT_MS));
    waking = Promise.race([active.resume(), limit])
      .then(
        () => active.state() === "running",
        (cause: unknown) => {
          options.onError?.(
            new Error(`foley could not resume audio (state: ${active.state()}). Sounds stay silent until the next user gesture. Your app is unaffected.`, { cause }),
          );
          return false;
        },
      )
      .then((running) => {
        waking = null;
        const waiting = pending;
        pending = null;
        if (running && waiting !== null && Date.now() - waiting.askedAt <= STALE_MS) start(active, waiting.sound);
        return running;
      });
    return waking;
  };

  return {
    play: (sound) => {
      if (muted || volume === 0) return;
      const active = ensurePort();
      if (active === null) return;
      if (active.state() === "running") {
        start(active, sound);
        return;
      }
      // Only the latest request survives a wake. Playing every queued one at once would sum to a loud smack.
      pending = { sound, askedAt: Date.now() };
      void wake(active);
    },
    unlock: () => {
      const active = ensurePort();
      if (active === null) return Promise.resolve(false);
      if (active.state() === "running") return Promise.resolve(true);
      active.prime();
      return wake(active);
    },
    setVolume: (value) => {
      volume = volumeOf(value, volume);
      port?.bus.setLevel(volume);
    },
    setMuted: (value) => {
      muted = value;
      if (!muted) return;
      pending = null;
      port?.bus.silence();
    },
    dispose: () => {
      clearTimeout(idle);
      pending = null;
      port?.bus.silence();
    },
  };
}
