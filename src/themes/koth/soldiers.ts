// The soldiers of the King of the Hill theme: roles (minime variants, the core plans the fights with them) with id, name,
// default names in chat and the weapon as SVG paths, the shape of the soldier and who holds the hill. The factions
// (minime teams) with their default colors are in settings.ts. Colors come from the settings. Check: soldiers.check.ts.
import { MEDIC } from "../../core/minimeFields.ts";
import type { MinimeVariantSet } from "../../core/theme.ts";
import { circle } from "./hill.ts";

// weapon = gun or bag (weapon color), mark = scope, cross or ammo box (detail color); in the 80 x 120 space of the soldier
type WeaponPart = { kind: "weapon" | "mark"; d: string };
export type Role = { id: string; label: string; names: readonly string[]; weapon: readonly WeaponPart[] };

export const ROLES: readonly Role[] = [
  { id: "sturm", label: "Sturmsoldat", names: ["sturm", "sturmsoldat", "rifleman", "assault"], weapon: [
    { kind: "weapon", d: "M34 58 L76 56 L76 61 L58 62 L56 70 L50 70 L51 63 L36 64 Z" },
    { kind: "mark", d: "M56 53 L64 53 L64 56 L56 56 Z" },
  ] },
  { id: MEDIC, label: "Medic", names: [MEDIC, "sani", "sanitaeter"], weapon: [
    { kind: "weapon", d: "M12 54 L28 54 L28 78 L12 78 Z" },
    { kind: "mark", d: "M18.5 57 L21.5 57 L21.5 64.5 L25 64.5 L25 67.5 L21.5 67.5 L21.5 75 L18.5 75 L18.5 67.5 L15 67.5 L15 64.5 L18.5 64.5 Z" },
  ] },
  { id: "mg", label: "MG-Schütze", names: ["mg", "lmg", "maschinengewehr", "machinegun"], weapon: [
    { kind: "weapon", d: "M30 58 L80 54 L80 62 L58 64 L56 70 L48 70 L48 65 L32 66 Z M69 62 L65 78 L67 78 L71 62 Z M75 62 L79 78 L81 78 L77 62 Z" },
    { kind: "mark", d: "M44 64 L54 64 L54 74 L44 74 Z" },
  ] },
  { id: "sniper", label: "Scharfschütze", names: ["sniper", "scharfschuetze"], weapon: [
    { kind: "weapon", d: "M30 60 L86 57 L86 60 L58 62 L56 70 L50 70 L51 63 L32 64 Z" },
    { kind: "mark", d: "M48 52 L66 51 L66 55 L48 56 Z" },
  ] },
  { id: "grenadier", label: "Grenadier", names: ["grenadier", "granate", "grenade"], weapon: [
    { kind: "weapon", d: "M34 56 L72 54 L73 64 L58 65 L56 72 L50 72 L51 65 L36 66 Z" },
    { kind: "mark", d: "M62 49 L74 48 L75 56 L63 57 Z" },
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

// The soldier from the side, looking right (80 x 120): legs, torso in the faction color, belt, sleeve, head, helmet
export const SOLDIER = {
  legs: "M28 86 L26 118 L36 118 L40 94 L44 118 L54 118 L52 86 Z",
  torso: "M24 52 C24 44 56 44 56 52 L56 90 L24 90 Z",
  belt: "M24 78 L56 78 L56 84 L24 84 Z",
  sleeve: "M46 54 L66 60 L64 67 L44 62 Z",
  head: circle(40, 34, 13),
  helmet: "M24 32 C24 15 56 15 56 32 L60 34 L20 34 Z",
  eye: { x: 47, y: 35 },
} as const;

// Who holds the hill: the faction with the most soldiers; two or more with the same most: contested; nobody there: empty
export type HillState = { kind: "held"; team: string } | { kind: "contested" } | { kind: "empty" };

export function hillState(counts: Readonly<Record<string, number>>): HillState {
  const most = Math.max(0, ...Object.values(counts));
  if (most === 0) return { kind: "empty" };
  const leaders = Object.keys(counts).filter(team => counts[team] === most);
  return leaders.length === 1 ? { kind: "held", team: leaders[0] } : { kind: "contested" };
}
