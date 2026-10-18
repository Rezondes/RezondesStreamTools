// The mango soldiers of the Plantage theme: roles (minime variants, the core plans the fights with them) with id, name,
// default names in chat and the weapon as SVG paths, plus the shape of the mango with helmet and the spot of the face.
// Colors come from the settings (mango, blush, helmet, weapon, medic cross). Check: mangos.check.ts.
import { MEDIC } from "../../core/minimeFields.ts";
import type { MinimeVariantSet } from "../../core/theme.ts";

// weapon = gun or bag (weapon color), mark = scope, cross or stripe (detail color); in the 100 x 100 space of the mango
type WeaponPart = { kind: "weapon" | "mark"; d: string };
export type Role = { id: string; label: string; names: readonly string[]; weapon: readonly WeaponPart[] };

export const ROLES: readonly Role[] = [
  { id: "sturm", label: "Sturmsoldat", names: ["sturm", "sturmsoldat", "rifleman", "assault"], weapon: [
    { kind: "weapon", d: "M50 62 L96 56 L97 63 L72 66 L70 78 L62 78 L63 67 L52 68 Z" },
    { kind: "mark", d: "M74 54 L84 53 L84 57 L74 58 Z" },
  ] },
  { id: MEDIC, label: "Medic", names: [MEDIC, "sani", "sanitaeter"], weapon: [
    { kind: "weapon", d: "M58 56 L92 56 L92 84 L58 84 Z M68 56 C68 48 82 48 82 56 L78 56 C78 52 72 52 72 56 Z" },
    { kind: "mark", d: "M72 61 L78 61 L78 67 L84 67 L84 73 L78 73 L78 79 L72 79 L72 73 L66 73 L66 67 L72 67 Z" },
  ] },
  { id: "mg", label: "MG-Schütze", names: ["mg", "lmg", "maschinengewehr", "machinegun"], weapon: [
    { kind: "weapon", d: "M46 60 L100 54 L100 64 L74 67 L72 72 L60 72 L60 68 L48 69 Z M84 64 L80 88 L84 88 L88 64 Z M92 64 L96 88 L100 88 L96 64 Z" },
    { kind: "mark", d: "M60 68 L70 68 L70 80 L60 80 Z" },
  ] },
  { id: "sniper", label: "Scharfschütze", names: ["sniper", "scharfschuetze"], weapon: [
    { kind: "weapon", d: "M44 64 L104 58 L104 62 L72 66 L70 76 L62 76 L63 67 L46 69 Z" },
    { kind: "mark", d: "M62 54 L82 52 L82 58 L62 60 Z" },
  ] },
  { id: "grenadier", label: "Grenadier", names: ["grenadier", "granate", "grenade"], weapon: [
    { kind: "weapon", d: "M50 58 L92 54 L93 68 L72 70 L70 80 L62 80 L63 70 L52 70 Z" },
    { kind: "mark", d: "M86 52 L96 51 L97 71 L87 72 Z" },
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

// The mango with helmet (100 x 100): body (mango color), blush (blush color), leaf at the stem, helmet with strap
export const MANGO = {
  body: "M48 18 C74 16 90 40 85 66 C80 90 52 98 32 88 C14 78 14 50 27 33 C33 24 40 19 48 18 Z",
  blush: "M62 24 C78 30 86 46 83 62 C72 54 64 40 62 24 Z",
  leaf: "M47 18 C52 8 64 4 74 7 C66 15 56 19 47 18 Z",
  helmet: "M22 36 C24 16 40 8 54 9 C70 10 82 22 82 36 Z M18 34 L86 34 L86 40 L18 40 Z",
  strap: "M24 40 C26 54 34 60 40 62 M80 40 C78 54 70 60 64 62",
  face: { x: 48, y: 58, size: 0.85 },
} as const;
