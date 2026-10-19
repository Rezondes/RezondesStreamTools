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

// Pose per action; walking, idling, entering and leaving (and anything unknown) stand, the motion comes from minimes.css
const MOVE_POSES: Record<(typeof MINIME_MOVES)[number], PoseName> = {
  selfie: "selfie",
  snack: "snack",
  wave: "wave",
  dance: "cheer",
  look: "stand",
  sleep: "sleep",
};

export const minimePose = (action: string): PoseName => MOVE_POSES[action as keyof typeof MOVE_POSES] ?? "stand";
