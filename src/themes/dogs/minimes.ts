// The minimes of the Dogs theme (DESIGN-DOGS.md "Minimes"): joined chatters as small pixel dogs, the type is the breed
// (chosen with !rasse, DOG_SET), the coat comes from the login (lookOf). Besides walking and standing of the core they
// bark, sniff with dust, lie down and sleep with rising "Z"; on chat they wag fast. minimeCatalog gives the own
// actions with their settings (weight 0 leaves one out), minimePose the pose of an action. Pure; check: minimes.check.ts.
import type { MinimeAction } from "../../core/minimeBehavior.ts";
import type { MinimeVariantSet } from "../../core/theme.ts";
import { BREED_IDS, BREEDS, type BreedId } from "./breeds.ts";
import type { PoseInput } from "./poses.ts";

// The names in chat per breed (the first is the id)
const NAMES: Record<BreedId, string[]> = {
  corgi: ["corgi", "welsh"], shiba: ["shiba", "inu"], labrador: ["labrador", "lab"], dalmatiner: ["dalmatiner", "dalmi"], dackel: ["dackel", "dachshund"], mops: ["mops", "pug"],
};

export const DOG_SET: MinimeVariantSet = { command: "!rasse", label: "Rasse", variants: BREED_IDS.map(id => ({ id, label: BREEDS[id].name, names: NAMES[id] })) };

export const DOG_ACTIONS = ["bark", "sniff", "lie", "sleep"] as const;
export const MINIME_REACTION = "wag";

type MinimeValues = Readonly<Record<string, unknown>> & { walkFps: number; wagSpeed: number; blinkEvery: number; pant: boolean };

const keyOf = (action: string, part: "Ms" | "Weight") => `minime${action.charAt(0).toUpperCase()}${action.slice(1)}${part}`;

// The own actions with duration and weight from the settings, without the ones switched off by weight 0
export const minimeCatalog = (values: Readonly<Record<string, unknown>>): MinimeAction[] =>
  DOG_ACTIONS.map(name => ({ name, durationMs: Number(values[keyOf(name, "Ms")]), weight: Number(values[keyOf(name, "Weight")]) })).filter(action => action.weight > 0);

// The reaction to chat (weight 0: it never comes by itself)
export const minimeReaction = (values: Readonly<Record<string, unknown>>): MinimeAction => ({ name: MINIME_REACTION, durationMs: Number(values.minimeWagMs), weight: 0 });

// fixed: on chat the tail wags three times as fast; lying it wags slowly at 2
const WAG = { fast: 3, lying: 2 };

export type MinimePose = Omit<PoseInput, "time"> & { dust: boolean; zzz: boolean };

// The pose of an action: walking for walk, barking, lying (sleeping without wagging and with "Z"), sniffing with
// dust, wagging fast; everything else (idle, enter, exit) stands
export function minimePose(action: string, values: MinimeValues): MinimePose {
  const base = { fps: values.walkFps, wagSpeed: values.wagSpeed, blinkEvery: values.blinkEvery, pant: values.pant, dust: false, zzz: false };
  if (action === "walk") return { ...base, mode: "walk" };
  if (action === "bark") return { ...base, mode: "bark" };
  if (action === "lie") return { ...base, mode: "lie", wagSpeed: WAG.lying };
  if (action === "sleep") return { ...base, mode: "lie", wagSpeed: 0, blinkEvery: 0, pant: false, zzz: true };
  if (action === "sniff") return { ...base, mode: "stand", pant: false, dust: true };
  if (action === MINIME_REACTION) return { ...base, mode: "stand", wagSpeed: values.wagSpeed * WAG.fast };
  return { ...base, mode: "stand" };
}
