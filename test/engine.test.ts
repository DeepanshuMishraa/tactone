import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEngine, type Port } from "../src/engine.ts";
import { Sound } from "../src/sound.ts";

const sound = Sound.of([{ kind: "tone", wave: "sine", frequency: 440, attack: 0.001, decay: 0.1, peak: 0.5 }]);
const other = Sound.of([{ kind: "tone", wave: "sine", frequency: 880, attack: 0.001, decay: 0.1, peak: 0.5 }]);

type Resume = (wake: () => void) => Promise<void>;

/** Like a real context, the default resume only reports running a moment after it is called. */
const resumeSoon: Resume = async (wake) => {
  await Promise.resolve();
  wake();
};

function fakePort(initial: ReturnType<Port["state"]> = "running", resume: Resume = resumeSoon) {
  let state = initial;
  let time = 0;
  const played: { sound: Sound; when: number }[] = [];
  const port: Port = {
    state: () => state,
    now: () => time,
    resume: vi.fn(() =>
      resume(() => {
        state = "running";
      }),
    ),
    suspend: vi.fn(async () => {
      state = "suspended";
    }),
    prime: vi.fn(),
    bus: {
      play: (value, when) => {
        played.push({ sound: value, when });
      },
      silence: vi.fn(),
      setLevel: vi.fn(),
    },
  };
  return {
    port,
    played,
    advance: (seconds: number) => {
      time += seconds;
    },
  };
}

const flush = async () => {
  await vi.advanceTimersByTimeAsync(0);
};

describe("engine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does nothing without a port, as during SSR", async () => {
    const engine = createEngine({ connect: () => null });
    expect(() => engine.play(sound)).not.toThrow();
    await expect(engine.unlock()).resolves.toBe(false);
  });

  it("schedules slightly ahead so the attack survives", () => {
    const { port, played } = fakePort();
    createEngine({ connect: () => port }).play(sound);
    expect(played[0]?.when).toBeGreaterThan(0);
  });

  it("plays only the latest of the sounds asked for while waking", async () => {
    const { port, played } = fakePort("suspended");
    const engine = createEngine({ connect: () => port });
    engine.play(sound);
    engine.play(sound);
    engine.play(other);
    await flush();
    expect(played).toHaveLength(1);
    expect(played[0]?.sound).toEqual(other);
    expect(port.resume).toHaveBeenCalledTimes(1);
  });

  it("drops a sound that waited too long, since it would land detached from its cause", async () => {
    const slow: Resume = (wake) =>
      new Promise((resolve) => {
        setTimeout(() => {
          wake();
          resolve();
        }, 400);
      });
    const { port, played } = fakePort("suspended", slow);
    createEngine({ connect: () => port }).play(sound);
    await vi.advanceTimersByTimeAsync(500);
    expect(port.state()).toBe("running");
    expect(played).toHaveLength(0);
  });

  it("tries again after a resume that never settles, as Safari can do outside a gesture", async () => {
    const { port } = fakePort("suspended", () => new Promise(() => {}));
    const engine = createEngine({ connect: () => port });
    engine.play(sound);
    await vi.advanceTimersByTimeAsync(1000);
    engine.play(sound);
    expect(port.resume).toHaveBeenCalledTimes(2);
  });

  it("merges a double hit of the same sound, which would otherwise double the level", () => {
    const { port, played, advance } = fakePort();
    const engine = createEngine({ connect: () => port });
    engine.play(sound);
    advance(0.005);
    engine.play(sound);
    advance(0.1);
    engine.play(sound);
    expect(played).toHaveLength(2);
  });

  it("suspends after quiet so Safari releases the audio device, and wakes on the next play", async () => {
    const { port, played } = fakePort();
    const engine = createEngine({ connect: () => port });
    engine.play(sound);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(port.suspend).toHaveBeenCalledTimes(1);
    engine.play(other);
    await flush();
    expect(played).toHaveLength(2);
  });

  it("primes iOS and reports readiness on unlock", async () => {
    const { port } = fakePort("suspended");
    await expect(createEngine({ connect: () => port }).unlock()).resolves.toBe(true);
    expect(port.prime).toHaveBeenCalled();
  });

  it("resolves false and reports when resume fails, never rejecting", async () => {
    const { port } = fakePort("suspended", () => Promise.reject(new Error("blocked")));
    const onError = vi.fn();
    await expect(createEngine({ connect: () => port, onError }).unlock()).resolves.toBe(false);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("silences at once on mute, and forgets a pending sound", async () => {
    const { port, played } = fakePort("suspended");
    const engine = createEngine({ connect: () => port });
    engine.play(sound);
    engine.setMuted(true);
    await flush();
    expect(played).toHaveLength(0);
    expect(port.bus.silence).toHaveBeenCalled();
  });

  it("clamps volume and ignores junk", () => {
    const { port } = fakePort();
    const engine = createEngine({ connect: () => port });
    engine.play(sound);
    engine.setVolume(4);
    engine.setVolume(Number.NaN);
    expect(port.bus.setLevel).toHaveBeenLastCalledWith(1);
  });
});
