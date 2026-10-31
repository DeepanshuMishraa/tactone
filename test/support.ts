import { Sound } from "../src/sound.ts";

export const tick = Sound.of([{ kind: "tone", wave: "sine", frequency: 1000, attack: 0.001, decay: 0.02, peak: 0.5 }]);
