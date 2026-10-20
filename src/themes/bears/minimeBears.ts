// The minime variants of the Bärenbande theme: chatters choose a bear with !baer (word and names in chat are settings of
// the core variant fields), plus the pose of the character model each minime action shows (scenes/Minimes.tsx).
// Check: minimeBears.check.ts.
import type { MinimeVariantSet } from "../../core/theme.ts";
import { BEAR_IDS, type BearId } from "./bears.ts";
import { POSES, towerLayout, type Drops, type PoseName } from "./rig.ts";

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
// In a tower (core actions) the base braces on all fours, a climbing bear stands up and reaches for the back above, the stacked bears
// stand on all fours and the top one raises a front leg; gathering and stepping off stand.
const MOVE_POSES: Record<string, PoseName> = {
  selfie: "selfie",
  snack: "snack",
  wave: "wave",
  dance: "cheer",
  look: "stand",
  sleep: "sleep",
  brace: "four",
  climb: "climb",
  stacked: "four",
  stackWalk: "four",
};
// On the back of another minime the legs are tucked (perch), the top one raises a front leg
const UPPER_POSES: Record<string, PoseName> = { stacked: "perch", stackWalk: "perch" };
const TOP_POSES: Record<string, PoseName> = { stacked: "perchWave", stackWalk: "perchWave" };

export const minimePose = (action: string, top = false, upper = top): PoseName =>
  (top ? TOP_POSES[action] : undefined) ?? (upper ? UPPER_POSES[action] : undefined) ?? MOVE_POSES[action] ?? "stand";

// Where a level of a minime tower stands in px: lifted onto the back below and shifted to its middle (rig.ts
// towerLayout, upper levels with tucked legs, the top one with the raised front leg), sizePx = the minime size (height of a standing bear), fitPx = the
// fine correction per level from the settings; drops: how far each leg reaches down onto the back below
export function towerLift(types: readonly string[], level: number, sizePx: number, fitPx = 0): { lift: number; shift: number; drops: Drops } {
  const bears = types.filter((type): type is BearId => (BEAR_IDS as readonly string[]).includes(type));
  const placed = towerLayout(bears.map((bear, index) => ({ bear, pose: index === 0 ? "four" : index === bears.length - 1 ? "perchWave" : "perch" })));
  const spot = placed[level - 1];
  if (!spot) return { lift: 0, shift: 0, drops: {} };
  const unit = sizePx / POSES.stand.height;
  return { lift: -spot.y * unit + (level - 1) * fitPx, shift: spot.x * unit, drops: spot.drops };
}
