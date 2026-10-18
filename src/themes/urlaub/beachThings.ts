// The beach things of the Urlaub theme (minime variants): id, name, default names in chat, shape as SVG paths (text) and
// position of the face. Colors come from the settings (thing<Id>Main, thing<Id>Detail, accent, wood, outline).
// Check: beachThings.check.ts.
import type { MinimeVariantSet } from "../../core/theme.ts";
import { circle, spikes } from "./beach.ts";

// body = main area (main color, outline; a second subpath cuts a hole, e.g. a ring), detail = area in detail color,
// line = line in detail color, leaf = accent area (accent color), stem = wood or handle (wood color)
type ThingPart = { kind: "body" | "detail" | "line" | "leaf" | "stem"; d: string };
// face: center of the face in the shape (100 x 100) and size (1 = normal)
export type BeachThing = { id: string; label: string; names: readonly string[]; parts: readonly ThingPart[]; face: { x: number; y: number; size: number } };

export const BEACH_THINGS: readonly BeachThing[] = [
  { id: "rettungsring", label: "Rettungsring", names: ["rettungsring", "ring", "lifebuoy"], face: { x: 50, y: 52, size: 0.55 }, parts: [
    { kind: "body", d: `${circle(50, 52, 44)} ${circle(50, 52, 20)}` },
    { kind: "detail", d: "M44 9 L56 9 L54 32 L46 32 Z M46 72 L54 72 L56 95 L44 95 Z M7 46 L30 48 L30 56 L7 58 Z M93 46 L70 48 L70 56 L93 58 Z" },
  ] },
  { id: "badeente", label: "Badeente", names: ["badeente", "ente", "duck", "rubberduck"], face: { x: 62, y: 30, size: 0.55 }, parts: [
    { kind: "body", d: "M20 60 C20 44 34 40 46 44 C44 36 46 22 60 18 C74 16 82 28 78 40 C76 46 72 48 70 50 C82 50 92 54 90 66 C88 84 70 92 50 92 C30 92 20 80 20 60 Z" },
    { kind: "detail", d: "M78 32 C86 30 94 32 96 36 C90 40 84 40 78 38 Z" },
    { kind: "line", d: "M36 64 C44 60 56 62 62 70" },
  ] },
  { id: "wasserball", label: "Wasserball", names: ["wasserball", "ball", "beachball"], face: { x: 50, y: 52, size: 0.9 }, parts: [
    { kind: "body", d: circle(50, 52, 42) },
    { kind: "detail", d: "M50 10 C36 24 32 40 34 52 C36 70 42 84 50 94 C40 92 18 80 10 56 C10 34 26 14 50 10 Z" },
    { kind: "line", d: "M50 10 C64 24 68 40 66 52 C64 70 58 84 50 94" },
  ] },
  { id: "surfbrett", label: "Surfbrett", names: ["surfbrett", "surf", "surfboard"], face: { x: 50, y: 66, size: 0.75 }, parts: [
    { kind: "body", d: "M50 4 C64 14 70 40 70 60 C70 82 62 96 50 98 C38 96 30 82 30 60 C30 40 36 14 50 4 Z" },
    { kind: "detail", d: "M32 42 L68 42 L69 50 L31 50 Z" },
    { kind: "line", d: "M50 10 L50 38" },
    { kind: "stem", d: "M46 96 L54 96 L50 100 Z" },
  ] },
  { id: "sonnenschirm", label: "Sonnenschirm", names: ["sonnenschirm", "schirm", "umbrella"], face: { x: 50, y: 28, size: 0.7 }, parts: [
    { kind: "stem", d: "M48 44 L52 44 L52 96 L48 96 Z" },
    { kind: "body", d: "M6 46 C10 22 30 8 50 8 C70 8 90 22 94 46 C86 42 78 42 72 46 C66 42 56 42 50 46 C44 42 34 42 28 46 C22 42 14 42 6 46 Z" },
    { kind: "detail", d: "M50 8 C42 18 36 32 28 46 C34 42 44 42 50 46 Z M50 8 C58 18 64 32 72 46 C66 42 56 42 50 46 Z" },
  ] },
  { id: "flamingo", label: "Flamingo-Schwimmring", names: ["flamingo", "flamingoring", "schwimmring"], face: { x: 57, y: 19, size: 0.4 }, parts: [
    { kind: "body", d: `${circle(50, 64, 34)} ${circle(50, 64, 14)}` },
    { kind: "detail", d: "M66 46 C74 34 72 22 66 16 C60 10 50 12 50 20 C50 26 56 28 60 24 C64 30 62 38 58 46 Z" },
    { kind: "stem", d: "M50 18 L42 22 L48 24 Z" },
  ] },
  { id: "liegestuhl", label: "Liegestuhl", names: ["liegestuhl", "stuhl", "deckchair"], face: { x: 54, y: 42, size: 0.6 }, parts: [
    { kind: "stem", d: "M24 16 L30 16 L30 96 L24 96 Z M78 64 L84 64 L84 96 L78 96 Z M24 70 L84 70 L84 76 L24 76 Z" },
    { kind: "body", d: "M28 18 L62 18 L80 70 L46 70 Z" },
    { kind: "detail", d: "M38 18 L46 18 L64 70 L56 70 Z" },
  ] },
  { id: "sandeimer", label: "Sandeimer", names: ["sandeimer", "eimer", "bucket"], face: { x: 50, y: 62, size: 0.9 }, parts: [
    { kind: "line", d: "M22 30 C22 6 78 6 78 30" },
    { kind: "body", d: "M22 30 L78 30 L70 92 L30 92 Z" },
    { kind: "detail", d: "M18 26 L82 26 L80 36 L20 36 Z" },
  ] },
  { id: "eis", label: "Eis am Stiel", names: ["eis", "eisamstiel", "popsicle", "icecream"], face: { x: 50, y: 56, size: 0.85 }, parts: [
    { kind: "stem", d: "M45 78 L55 78 L55 98 L45 98 Z" },
    { kind: "body", d: "M28 20 C28 8 72 8 72 20 L72 72 C72 78 68 80 64 80 L36 80 C32 80 28 78 28 72 Z" },
    { kind: "detail", d: "M28 20 C28 8 72 8 72 20 L72 32 C66 36 62 30 58 36 C54 42 48 34 44 38 C38 42 34 34 28 36 Z" },
  ] },
  { id: "muschel", label: "Muschel", names: ["muschel", "shell"], face: { x: 50, y: 48, size: 0.85 }, parts: [
    { kind: "body", d: "M50 94 L40 86 C22 80 8 62 10 42 C14 22 32 10 50 10 C68 10 86 22 90 42 C92 62 78 80 60 86 Z" },
    { kind: "line", d: "M50 84 L30 18 M50 84 L50 12 M50 84 L70 18 M50 84 L16 36 M50 84 L84 36" },
    { kind: "detail", d: "M40 86 L60 86 L56 96 L44 96 Z" },
  ] },
  { id: "seestern", label: "Seestern", names: ["seestern", "starfish"], face: { x: 50, y: 56, size: 0.8 }, parts: [
    { kind: "body", d: spikes(50, 56, 46, 26, 5) },
    { kind: "detail", d: `${circle(50, 22, 2.5)} ${circle(20, 46, 2.5)} ${circle(80, 46, 2.5)} ${circle(32, 82, 2.5)} ${circle(68, 82, 2.5)}` },
  ] },
  { id: "krebs", label: "Krebs", names: ["krebs", "krabbe", "crab"], face: { x: 50, y: 58, size: 0.9 }, parts: [
    { kind: "line", d: "M24 48 L14 38 M76 48 L86 38 M22 70 L8 76 M24 76 L12 86 M78 70 L92 76 M76 76 L88 86" },
    { kind: "body", d: "M18 60 C18 44 32 36 50 36 C68 36 82 44 82 60 C82 76 68 84 50 84 C32 84 18 76 18 60 Z" },
    { kind: "detail", d: "M10 36 C2 26 8 12 20 14 C16 20 18 26 24 26 C24 32 18 38 10 36 Z M90 36 C98 26 92 12 80 14 C84 20 82 26 76 26 C76 32 82 38 90 36 Z" },
  ] },
  { id: "schnorchel", label: "Schnorchelmaske", names: ["schnorchel", "schnorchelmaske", "snorkel"], face: { x: 50, y: 48, size: 0.95 }, parts: [
    { kind: "stem", d: "M88 30 L94 30 L94 70 C94 80 86 82 80 78 L82 74 C86 76 88 74 88 70 Z" },
    { kind: "body", d: "M14 40 C14 26 30 22 50 26 C70 22 86 26 86 40 L86 58 C86 70 74 74 62 70 C56 66 44 66 38 70 C26 74 14 70 14 58 Z" },
    { kind: "detail", d: "M22 38 C22 32 34 30 48 34 L48 60 C42 62 34 66 28 64 C24 62 22 58 22 54 Z M52 34 C66 30 78 32 78 38 L78 54 C78 58 76 62 72 64 C66 66 58 62 52 60 Z" },
  ] },
  { id: "sonnenbrille", label: "Sonnenbrille", names: ["sonnenbrille", "brille", "shades"], face: { x: 50, y: 54, size: 0.9 }, parts: [
    { kind: "stem", d: "M44 38 L56 38 L56 44 L44 44 Z" },
    { kind: "body", d: "M6 36 L46 36 L44 62 C40 72 22 74 12 66 C6 60 6 48 6 36 Z M54 36 L94 36 C94 48 94 60 88 66 C78 74 60 72 56 62 Z" },
    { kind: "detail", d: "M14 42 L22 42 L16 54 Z M62 42 L70 42 L64 54 Z" },
  ] },
  { id: "cocktail", label: "Cocktail", names: ["cocktail", "drink"], face: { x: 50, y: 36, size: 0.55 }, parts: [
    { kind: "stem", d: "M62 4 L66 4 L58 30 L54 30 Z" },
    { kind: "body", d: "M14 20 L86 20 L54 56 L54 84 L70 90 L30 90 L46 84 L46 56 Z" },
    { kind: "detail", d: "M22 28 L78 28 L52 54 L48 54 Z" },
    { kind: "leaf", d: "M70 6 C84 6 92 14 92 20 L70 20 Z" },
  ] },
  { id: "strandtasche", label: "Strandtasche", names: ["strandtasche", "tasche", "beachbag", "bag"], face: { x: 50, y: 74, size: 0.8 }, parts: [
    { kind: "line", d: "M30 38 C30 14 46 14 46 38 M54 38 C54 14 70 14 70 38" },
    { kind: "body", d: "M14 38 L86 38 L80 92 L20 92 Z" },
    { kind: "detail", d: "M16 52 L84 52 L83 62 L17 62 Z" },
  ] },
];

export const THING_IDS = BEACH_THINGS.map(thing => thing.id);

// Minime variants for the schema: command !typ, per beach thing id, name and names in chat
export const THING_SET: MinimeVariantSet = {
  command: "!typ",
  label: "Typ",
  variants: BEACH_THINGS.map(({ id, label, names }) => ({ id, label, names })),
};

export const findThing = (id: string) => BEACH_THINGS.find(thing => thing.id === id) ?? BEACH_THINGS[0];
