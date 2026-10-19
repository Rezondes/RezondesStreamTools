// The minime variants of the Bärenbande theme: chatters choose a bear with !baer (word and names in chat are settings of
// the core variant fields), plus the pose of the character model each minime action shows (scenes/Minimes.tsx).
// Check: minimeBears.check.ts.
import type { MinimeVariantSet } from "../../core/theme.ts";
import type { PoseName } from "./bears.ts";

export const BEAR_SET: MinimeVariantSet = {
  command: "!baer",
  label: "Bär",
  variants: [
    { id: "eisbaer", label: "Eisbär", names: ["eisbaer", "eis", "polar", "ice"] },
    { id: "grizzly", label: "Grizzly", names: ["grizzly", "braunbaer", "brown"] },
    { id: "panda", label: "Panda", names: ["panda"] },
  ],
};

// The own animations of the catalog (weight and duration are settings); the reaction to chat is a wave
export const MINIME_MOVES = ["selfie", "snack", "wave", "dance", "look", "sleep"] as const;
export const MINIME_REACTION = "wave";

// Pose per action; walking, idling, entering and leaving (and anything unknown) stand, the motion comes from minimes.css.
// In a tower (core actions) the base braces on all fours, a climbing bear reaches up with a front leg, the stacked bears
// stand on all fours and the top one raises a front leg; gathering and stepping off stand.
const MOVE_POSES: Record<string, PoseName> = {
  selfie: "selfie",
  snack: "snack",
  wave: "wave",
  dance: "cheer",
  look: "stand",
  sleep: "sleep",
  brace: "four",
  climb: "fourWave",
  stacked: "four",
  stackWalk: "four",
};
const TOP_POSES: Record<string, PoseName> = { stacked: "fourWave", stackWalk: "fourWave" };

export const minimePose = (action: string, top = false): PoseName => (top ? TOP_POSES[action] : undefined) ?? MOVE_POSES[action] ?? "stand";

// Height of a level in px above the ground: the steps of the bears below (percent of the minime size per bear)
export function towerLift(types: readonly string[], level: number, stepPercent: Readonly<Record<string, number>>, sizePx: number): number {
  return types.slice(0, Math.max(0, level - 1)).reduce((sum, type) => sum + ((stepPercent[type] ?? 0) / 100) * sizePx, 0);
}
