// The soldiers of the King of the Hill theme in 3D (DESIGN-KOTH.md "Modernisierung"): roles (minime variants, the core
// plans the fights with them) with id, name, default names in chat and their weapon; the body as parts of the core figure
// (helmet, head, torso in the faction color, arms, legs, boots) and the poses of their animations. Who holds the hill.
// The factions (minime teams) with their default colors are in settings.ts. Check: soldiers3d.check.ts.
import { MEDIC } from "../../core/minimeFields.ts";
import type { MinimeVariantSet } from "../../core/theme.ts";
import type { Point3 } from "../../core/three/beam.ts";
import { type FigurePart, plateau, type PoseMove, poser, swing } from "../../core/three/figure.ts";

// Colors of the settings: skin, uniform = faction color, pants = darker faction color, gear = belt and boots, eye, helmet,
// weapon, mark = scope and ammo, bag = medic bag, cross = medic cross
export type SoldierTone = "skin" | "uniform" | "pants" | "gear" | "eye" | "helmet" | "weapon" | "mark" | "bag" | "cross";
type SoldierPart = FigurePart<SoldierTone>;
type WeaponPart = Pick<SoldierPart, "shape" | "size" | "offset" | "tone" | "turn">;
export type Role = { id: string; label: string; names: readonly string[]; weapon: readonly WeaponPart[] };

const QUARTER = Math.PI / 2;
const ALONG: Point3 = [QUARTER, 0, 0];

// Weapons in units of the figure height around the right hand, forward is +z
const RIFLE: WeaponPart[] = [
  { shape: "box", size: [0.03, 0.05, 0.22], offset: [0, 0.01, 0.08], tone: "weapon" },
  { shape: "cylinder", size: [0.008, 0.12, 0.008], offset: [0, 0.02, 0.24], tone: "weapon", turn: ALONG },
  { shape: "box", size: [0.024, 0.06, 0.03], offset: [0, -0.03, 0.1], tone: "weapon" },
];

export const ROLES: readonly Role[] = [
  { id: "sturm", label: "Sturmsoldat", names: ["sturm", "sturmsoldat", "rifleman", "assault"], weapon: [
    ...RIFLE,
    { shape: "box", size: [0.02, 0.02, 0.05], offset: [0, 0.045, 0.08], tone: "mark" },
  ] },
  // The medic carries the bag with the cross on its outer side and no weapon
  { id: MEDIC, label: "Medic", names: [MEDIC, "sani", "sanitaeter"], weapon: [
    { shape: "box", size: [0.05, 0.14, 0.12], offset: [0.03, -0.03, 0], tone: "bag" },
    { shape: "box", size: [0.006, 0.08, 0.025], offset: [0.058, -0.03, 0], tone: "cross" },
    { shape: "box", size: [0.006, 0.025, 0.08], offset: [0.058, -0.03, 0], tone: "cross" },
  ] },
  { id: "mg", label: "MG-Schütze", names: ["mg", "lmg", "maschinengewehr", "machinegun"], weapon: [
    { shape: "box", size: [0.036, 0.06, 0.28], offset: [0, 0.01, 0.1], tone: "weapon" },
    { shape: "cylinder", size: [0.011, 0.16, 0.011], offset: [0, 0.02, 0.31], tone: "weapon", turn: ALONG },
    { shape: "box", size: [0.046, 0.05, 0.05], offset: [0, -0.035, 0.07], tone: "mark" },
    { shape: "cylinder", size: [0.004, 0.09, 0.004], offset: [-0.02, -0.04, 0.32], tone: "weapon", turn: [0.3, 0, -0.3] },
    { shape: "cylinder", size: [0.004, 0.09, 0.004], offset: [0.02, -0.04, 0.32], tone: "weapon", turn: [0.3, 0, 0.3] },
  ] },
  { id: "sniper", label: "Scharfschütze", names: ["sniper", "scharfschuetze"], weapon: [
    { shape: "box", size: [0.028, 0.045, 0.26], offset: [0, 0.01, 0.09], tone: "weapon" },
    { shape: "cylinder", size: [0.007, 0.2, 0.007], offset: [0, 0.02, 0.32], tone: "weapon", turn: ALONG },
    { shape: "cylinder", size: [0.014, 0.1, 0.014], offset: [0, 0.055, 0.09], tone: "mark", turn: ALONG },
  ] },
  { id: "grenadier", label: "Grenadier", names: ["grenadier", "granate", "grenade"], weapon: [
    ...RIFLE,
    { shape: "cylinder", size: [0.02, 0.1, 0.02], offset: [0, -0.02, 0.21], tone: "weapon", turn: ALONG },
    { shape: "sphere", size: [0.016, 0, 0], offset: [0, -0.02, 0.265], tone: "mark" },
  ] },
];

export const ROLE_IDS = ROLES.map(role => role.id);
// Roles whose shot is an explosion (sound and look in the fights)
export const EXPLOSIVE: readonly string[] = ["grenadier"];

// Minime variants for the schema: command !rolle, per role id, name and names in chat
export const ROLE_SET: MinimeVariantSet = {
  command: "!rolle",
  label: "Rolle",
  variants: ROLES.map(({ id, label, names }) => ({ id, label, names })),
};

export const findRole = (id: string) => ROLES.find(role => role.id === id) ?? ROLES[0];

const HIP_L: Point3 = [-0.065, 0.36, 0];
const HIP_R: Point3 = [0.065, 0.36, 0];
const WAIST: Point3 = [0, 0.36, 0];
const SHOULDER_L: Point3 = [-0.16, 0.64, 0];
const SHOULDER_R: Point3 = [0.16, 0.64, 0];
const NECK: Point3 = [0, 0.68, 0];
const HAND: Point3 = [0.16, 0.37, 0];

// Body in units of the figure height: legs in uniform pants with boots, jacket in the faction color with belt and
// chest pouches, arms with hands, head with eyes, combat helmet with rim and chin strap
const BODY: SoldierPart[] = [
  { joint: "legL", shape: "capsule", size: [0.052, 0.22, 0], pivot: HIP_L, offset: [0, -0.16, 0], tone: "pants" },
  { joint: "legL", shape: "box", size: [0.1, 0.07, 0.15], pivot: HIP_L, offset: [0, -0.325, 0.025], tone: "gear" },
  { joint: "legR", shape: "capsule", size: [0.052, 0.22, 0], pivot: HIP_R, offset: [0, -0.16, 0], tone: "pants" },
  { joint: "legR", shape: "box", size: [0.1, 0.07, 0.15], pivot: HIP_R, offset: [0, -0.325, 0.025], tone: "gear" },
  { joint: "torso", shape: "cylinder", size: [0.135, 0.3, 0.12], pivot: WAIST, offset: [0, 0.15, 0], tone: "uniform" },
  { joint: "torso", shape: "cylinder", size: [0.124, 0.045, 0.124], pivot: WAIST, offset: [0, 0.02, 0], tone: "gear" },
  { joint: "torso", shape: "box", size: [0.07, 0.07, 0.04], pivot: WAIST, offset: [-0.06, 0.17, 0.115], tone: "gear" },
  { joint: "torso", shape: "box", size: [0.07, 0.07, 0.04], pivot: WAIST, offset: [0.06, 0.17, 0.115], tone: "gear" },
  { joint: "armL", shape: "capsule", size: [0.04, 0.19, 0], pivot: SHOULDER_L, offset: [0, -0.12, 0], tone: "uniform" },
  { joint: "armL", shape: "sphere", size: [0.042, 0, 0], pivot: SHOULDER_L, offset: [0, -0.27, 0], tone: "skin" },
  { joint: "armR", shape: "capsule", size: [0.04, 0.19, 0], pivot: SHOULDER_R, offset: [0, -0.12, 0], tone: "uniform" },
  { joint: "armR", shape: "sphere", size: [0.042, 0, 0], pivot: SHOULDER_R, offset: [0, -0.27, 0], tone: "skin" },
  { joint: "head", shape: "sphere", size: [0.1, 0, 0], pivot: NECK, offset: [0, 0.12, 0], tone: "skin" },
  { joint: "head", shape: "sphere", size: [0.014, 0, 0], pivot: NECK, offset: [-0.035, 0.13, 0.092], tone: "eye", blinks: true },
  { joint: "head", shape: "sphere", size: [0.014, 0, 0], pivot: NECK, offset: [0.035, 0.13, 0.092], tone: "eye", blinks: true },
  { joint: "head", shape: "dome", size: [0.12, 0, 0], pivot: NECK, offset: [0, 0.14, 0], tone: "helmet", lifts: true },
  { joint: "head", shape: "cylinder", size: [0.13, 0.02, 0.13], pivot: NECK, offset: [0, 0.14, 0], tone: "helmet", lifts: true },
  { joint: "head", shape: "box", size: [0.205, 0.012, 0.012], pivot: NECK, offset: [0, 0.07, 0.04], tone: "gear", turn: [0.5, 0, 0] },
];

// The soldier of a role (faces: with eyes); unknown roles carry the rifle of the first role
export function soldier(role: string, faces = true): SoldierPart[] {
  const body = faces ? BODY : BODY.filter(part => part.tone !== "eye");
  return [...body, ...findRole(role).weapon.map(part => ({ ...part, joint: "tool" as const, pivot: HAND }))];
}

// Where the shot leaves the weapon (front end, relative to the hand), null without a weapon
export function muzzleOf(role: string): Point3 | null {
  const parts = findRole(role).weapon.filter(part => part.tone === "weapon");
  if (parts.length === 0) return null;
  const front = Math.max(...parts.map(part => part.offset[2] + (part.turn === ALONG ? part.size[1] : part.size[2]) / 2));
  return [0, 0.02, front];
}

// Weapon at the shoulder: the arms come up, the weapon stays level
const SHOULDERED = { armR: -1.4, armL: -1.3, tool: 1.4 };
const CRAWL = (part: number) => ({ fall: 1, legL: 0.4 * swing(part, 3), legR: -0.4 * swing(part, 3), armL: -2 + 0.4 * swing(part, 3), armR: -2 - 0.4 * swing(part, 3), tool: 2 });
// Animations on the spot, the reaction and the fights of the core; quick in and out where a stance is held
const MOVES: Record<string, PoseMove> = {
  sight: { shape: () => ({ ...SHOULDERED, head: 0.1 }), weight: plateau(0.15) },
  reload: part => ({ armR: -0.7, tool: 0.7, armL: -0.9 + 0.3 * swing(part, 2), head: 0.35 }),
  cover: { shape: () => ({ legL: 1.1, legR: 1.1, bob: -0.16, torso: 0.35, head: -0.1 }), weight: plateau(0.15) },
  prone: { shape: () => ({ fall: 1, armL: -2, armR: -2, tool: 2 }), weight: plateau(0.12) },
  look: part => ({ turn: 1.2 * swing(part, 1), head: -0.1 }),
  salute: { shape: () => ({ armL: -2.6, head: -0.1 }), weight: plateau(0.2) },
  cheer: part => ({ armL: -2.8 + 0.3 * swing(part, 3), bob: 0.08 * Math.abs(swing(part, 2)) }),
  // Walking back to the place and the medic's approach: crawling low over the ground
  walk: { shape: CRAWL, weight: plateau(0.1) },
  approach: { shape: CRAWL, weight: plateau(0.1) },
  aim: { shape: () => SHOULDERED, weight: plateau(0.3) },
  fire: { shape: part => ({ ...SHOULDERED, torso: -0.06 * Math.abs(swing(part, 8)), tool: 1.4 - 0.1 * Math.abs(swing(part, 8)) }), weight: plateau(0.05) },
  hit: part => ({ torso: -0.4, head: -0.3, armL: -0.6 * swing(part, 1) }),
  // A hit soldier falls and stays down until it gets up again; down ends lying, up begins lying
  down: { shape: () => ({ fall: 1 }), weight: part => Math.min(1, part * 6) },
  up: { shape: () => ({ fall: 1 }), weight: part => Math.max(0, 1 - part) },
  revive: part => ({ legL: 1.2, legR: 0.3, bob: -0.12, torso: 0.5, armL: -0.9 + 0.3 * swing(part, 4), armR: -0.9 - 0.3 * swing(part, 4) }),
};
// Animations that do not begin or end at rest (down and up are one movement in two runs)
export const HELD = ["down", "up"];
// Animations in which the eyes stay shut
export const LYING = ["down"];

export const pose = poser(MOVES);
export const ANIMATIONS = Object.keys(MOVES);

// Who holds the hill: the faction with the most soldiers; two or more with the same most: contested; nobody there: empty
type HillState = { kind: "held"; team: string } | { kind: "contested" } | { kind: "empty" };

export function hillState(counts: Readonly<Record<string, number>>): HillState {
  const most = Math.max(0, ...Object.values(counts));
  if (most === 0) return { kind: "empty" };
  const leaders = Object.keys(counts).filter(team => counts[team] === most);
  return leaders.length === 1 ? { kind: "held", team: leaders[0] } : { kind: "contested" };
}
