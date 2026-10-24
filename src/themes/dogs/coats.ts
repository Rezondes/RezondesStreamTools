// Coats of the Dogs theme (DESIGN-DOGS.md "Fell"): 18 variants of the six breeds with name and pattern, their four
// colors from the settings (base, mark, dark, nose; keys like corgiRotweissBase, defaults in settings.ts), the palette
// of the pixel keys and the markings of each pattern as real shapes on the body: saddle (sable, tricolor), urajiro
// (light chest, cheeks and belly), sesame (speckled), tan points, mask, spots (fixed chance, no streaks).
// Check: coats.check.ts.
import { hash } from "../../core/hash.ts";
import { mixHex } from "../../core/color.ts";
import type { BreedBuild, BreedId } from "./breeds.ts";
import { covers, EMPTY, keyAt, pixelGrid, setKey, type Palette, type PixelGrid, type Shape } from "./pixels.ts";

export const PATTERNS = ["solid", "white", "sable", "tri", "urajiro", "urajiroTan", "sesame", "tan", "mask", "spots"] as const;
export type Pattern = (typeof PATTERNS)[number];
export type Coat = { breed: BreedId; id: string; name: string; pattern: Pattern };

const coat = (breed: BreedId, id: string, name: string, pattern: Pattern): Coat => ({ breed, id, name, pattern });

// Per breed its variants, the default first (DESIGN-DOGS.md table "Figuren")
export const COATS: readonly Coat[] = [
  coat("corgi", "rotweiss", "Rot-Weiss", "white"), coat("corgi", "zobel", "Zobel-Weiss", "sable"), coat("corgi", "tricolor", "Tricolor", "tri"),
  coat("shiba", "rot", "Rot", "urajiro"), coat("shiba", "sesam", "Sesam", "sesame"), coat("shiba", "schwarzloh", "Schwarz-Loh", "urajiroTan"), coat("shiba", "creme", "Creme", "urajiro"),
  coat("labrador", "gelb", "Gelb", "solid"), coat("labrador", "schwarz", "Schwarz", "solid"), coat("labrador", "braun", "Schokobraun", "solid"),
  coat("dalmatiner", "schwarz", "Schwarz getupft", "spots"), coat("dalmatiner", "leber", "Leberbraun getupft", "spots"),
  coat("dackel", "rot", "Rot", "solid"), coat("dackel", "schwarzrot", "Schwarz-Rot", "tan"), coat("dackel", "schokorot", "Schoko-Rot", "tan"),
  coat("mops", "beige", "Beige", "mask"), coat("mops", "apricot", "Apricot", "mask"), coat("mops", "schwarz", "Schwarz", "solid"),
];

export const COAT_PARTS = ["Base", "Mark", "Dark", "Nose"] as const;
type CoatPart = (typeof COAT_PARTS)[number];

// Settings key of a coat color, e.g. corgiRotweissBase
export const coatKey = (variant: Coat, part: CoatPart) => `${variant.breed}${variant.id.charAt(0).toUpperCase()}${variant.id.slice(1)}${part}`;

export const coatsOf = (breed: BreedId) => COATS.filter(variant => variant.breed === breed);

// The variant of a breed; an id the breed does not have gives its default
export const coatOf = (breed: BreedId, id: string): Coat => coatsOf(breed).find(variant => variant.id === id) ?? coatsOf(breed)[0];

export type CoatColors = { base: string; mark: string; dark: string; nose: string; pattern: Pattern };

// The four colors of a variant from the resolved settings
export function coatPalette(values: Readonly<Record<string, unknown>>, breed: BreedId, id: string): CoatColors {
  const variant = coatOf(breed, id);
  const read = (part: CoatPart) => String(values[coatKey(variant, part)]);
  return { base: read("Base"), mark: read("Mark"), dark: read("Dark"), nose: read("Nose"), pattern: variant.pattern };
}

// Colors every dog shares: outline, eye, tongue and inner ear, collar, tag, the highlight of the eye
export type DogColors = { ink: string; eye: string; tongue: string; collar: string; tag: string; light: string };

// fixed: how strongly saddle, sesame, mask and spots mix into the coat, like the prototype
const MIX = { sable: 0.45, sesame: 0.55, mask: 0.15, darker: 0.24 };
const BLACK = "#000000"; // fixed: darker tones mix toward black
const darker = (color: string, share: number) => mixHex(color, BLACK, share);

// Colors of the pixel keys of a dog
export function dogPalette(colors: CoatColors, shared: DogColors): Palette {
  const { base, mark, dark, nose, pattern } = colors;
  const saddle = pattern === "tri" ? dark : pattern === "sable" ? mixHex(base, dark, MIX.sable) : pattern === "sesame" ? mixHex(base, dark, MIX.sesame) : base;
  return {
    o: shared.ink, O: base, d: darker(base, MIX.darker), W: mark, S: saddle,
    T: pattern === "tan" ? mark : pattern === "urajiroTan" ? dark : base,
    M: pattern === "mask" ? dark : darker(base, MIX.mask),
    X: pattern === "spots" ? dark : darker(base, MIX.darker),
    N: nose, k: shared.eye, E: shared.light, P: shared.tongue, R: shared.collar, Y: shared.tag,
  };
}

export type SpotOptions = { share: number; seed: number };

// fixed: spots sit on a lattice of 3 pixels, each one 2 x 2 and shifted by up to one pixel (no streak over 4 pixels)
const LATTICE = 3;
const SPOT = 2;
const SALT = { cell: 7919, row: 131, shiftX: 17, shiftY: 29 };
// fixed: sesame speckles every other pixel at this chance; the spot above the eye of tan points
const SPECKLE = 0.5;
const BROW = { radius: [1.6, 1] as const, middle: 0.5 };

const mark = (marks: PixelGrid, body: PixelGrid, shape: Shape, key: string, onto: string) => {
  for (let y = 0; y < body.height; y++) {
    for (let x = 0; x < body.width; x++) {
      if (onto.includes(keyAt(body, x, y)) && covers(shape, x + 0.5, y + 0.5)) setKey(marks, x, y, key);
    }
  }
};

function spotMarks(marks: PixelGrid, body: PixelGrid, spots: SpotOptions) {
  for (let row = 0; row < body.height; row += LATTICE) {
    for (let column = 0; column < body.width; column += LATTICE) {
      if (keyAt(body, column, row) !== "O") continue;
      if (hash(spots.seed * SALT.cell + row * SALT.row + column) >= spots.share) continue;
      const left = column + Math.floor(hash(spots.seed + column * SALT.shiftX + row) * SPOT);
      const top = row + Math.floor(hash(spots.seed + row * SALT.shiftY + column) * SPOT);
      for (let dy = 0; dy < SPOT; dy++) for (let dx = 0; dx < SPOT; dx++) if (keyAt(body, left + dx, top + dy) === "O") setKey(marks, left + dx, top + dy, "X");
    }
  }
}

// The saddle follows the line of the back: per column from the first coat pixel down as deep as the back area is
// high; sable fades out with a dithered lowest row
function saddleMarks(marks: PixelGrid, body: PixelGrid, back: Shape, dithered: boolean) {
  const rows = [...Array(body.height).keys()];
  const columns = [...Array(body.width).keys()];
  const spans = columns.map(x => rows.filter(y => covers(back, x + 0.5, y + 0.5)));
  for (const x of columns) {
    if (spans[x].length === 0) continue;
    const top = rows.find(y => "OSd".includes(keyAt(body, x, y)) && keyAt(body, x, y - 1) !== "W");
    if (top === undefined) continue;
    const depth = spans[x].length;
    for (let y = top; y < top + depth; y++) {
      if (keyAt(body, x, y) !== "O") continue;
      if (dithered && y === top + depth - 1 && (x + y) % 2) continue;
      setKey(marks, x, y, "S");
    }
  }
}

function speckleMarks(marks: PixelGrid, body: PixelGrid, area: Shape, seed: number) {
  for (let y = 0; y < body.height; y++) {
    for (let x = 0; x < body.width; x++) {
      if ((x + y) % 2 || keyAt(body, x, y) !== "O" || !covers(area, x + 0.5, y + 0.5)) continue;
      if (hash(seed * SALT.cell + y * SALT.row + x) < SPECKLE) setKey(marks, x, y, "S");
    }
  }
}

// The markings of a pattern on the body of a breed, as keys in a grid of the same size (EMPTY elsewhere): only on the
// coat, the mark areas of the breed say where
export function markings(build: BreedBuild, pattern: Pattern, spots: SpotOptions): PixelGrid {
  const { body, breed } = build;
  const marks = pixelGrid(body.width, body.height);
  const { back, chest, cheek, belly, muzzle, brow } = breed.areas;
  const browSpot: Shape = { kind: "ellipse", center: [brow[0] + BROW.middle, brow[1] + BROW.middle], radius: BROW.radius };
  if (pattern === "white") for (const area of [chest, muzzle]) mark(marks, body, area, "W", "OW");
  if (pattern === "sable" || pattern === "tri") saddleMarks(marks, body, back, pattern === "sable");
  if (pattern === "sesame") speckleMarks(marks, body, back, spots.seed);
  if (pattern === "urajiro" || pattern === "urajiroTan") for (const area of [chest, cheek, belly]) mark(marks, body, area, "W", "OW");
  if (pattern === "urajiroTan" || pattern === "tan") mark(marks, body, browSpot, "T", "O");
  if (pattern === "tan") for (const area of [muzzle, chest]) mark(marks, body, area, "T", "OT");
  if (pattern === "mask") mark(marks, body, muzzle, "M", "OM");
  if (pattern === "spots" && breed.spots) spotMarks(marks, body, spots);
  return marks;
}

// The markings laid onto a copy of the body
export function markedBody(body: PixelGrid, marks: PixelGrid): PixelGrid {
  const marked: PixelGrid = { ...body, keys: [...body.keys], rims: new Int8Array(body.rims) };
  marks.keys.forEach((key, index) => {
    if (key !== EMPTY) marked.keys[index] = key;
  });
  return marked;
}
