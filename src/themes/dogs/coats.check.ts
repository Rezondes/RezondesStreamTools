// Check of coats.ts (PLAN-DOGS.md package 1, AC5): every marking pattern gives a non-empty area on the coat in its place
// (saddle on the back, urajiro at chest and cheeks, tan above the eye and on the paws, mask on the muzzle); spots are
// deterministic, near their share and never longer than 4 pixels in a row; the palette reads the settings.
// Run: node src/themes/dogs/coats.check.ts
import assert from "node:assert/strict";
import { buildBreed, type BreedId } from "./breeds.ts";
import { COATS, coatKey, coatOf, coatPalette, coatsOf, dogPalette, markedBody, markings, type Pattern } from "./coats.ts";
import { covers, EMPTY, keyAt, type PixelGrid } from "./pixels.ts";

const cells = (grid: PixelGrid, key: string) => [...grid.keys.keys()].filter(index => grid.keys[index] === key).map(index => [index % grid.width, Math.floor(index / grid.width)] as const);
const spots = { share: 0.42, seed: 1 };
const marksOf = (breed: BreedId, pattern: Pattern) => markings(buildBreed(breed), pattern, spots);

// 18 variants, every breed at least two, ids unique per breed
assert.equal(COATS.length, 18);
for (const breed of ["corgi", "shiba", "labrador", "dalmatiner", "dackel", "mops"] as const) {
  const ids = coatsOf(breed).map(variant => variant.id);
  assert.ok(ids.length >= 2 && new Set(ids).size === ids.length, breed);
}
assert.equal(coatOf("corgi", "gibtsnicht").id, "rotweiss", "unknown coat gives the default");
assert.equal(coatKey(coatOf("corgi", "rotweiss"), "Base"), "corgiRotweissBase");

// Abzeichen: every marking lies on the coat of the body
for (const variant of COATS) {
  const build = buildBreed(variant.breed);
  const marks = markings(build, variant.pattern, spots);
  for (let index = 0; index < marks.keys.length; index++) {
    if (marks.keys[index] !== EMPTY) assert.ok("OWSTMd".includes(build.body.keys[index]), `${variant.breed}/${variant.id}: marking outside the coat`);
  }
  if (variant.pattern !== "solid") assert.ok(marks.keys.some(key => key !== EMPTY), `${variant.breed}/${variant.id}: no marking`);
}

// Saddle on the back: above the legs, within the back of the breed
const corgi = buildBreed("corgi");
for (const pattern of ["tri", "sable"] as const) {
  const saddle = cells(marksOf("corgi", pattern), "S");
  assert.ok(saddle.length > 20, pattern);
  assert.ok(saddle.every(([x, y]) => y < corgi.breed.legTop && x <= 33), `${pattern}: saddle on the back`);
}
// Urajiro at chest, cheeks and belly; tan above the eye, at the muzzle and the paws; mask on the muzzle
const { areas } = buildBreed("shiba").breed;
const urajiro = cells(marksOf("shiba", "urajiro"), "W");
assert.ok(urajiro.length > 0 && urajiro.every(([x, y]) => [areas.chest, areas.cheek, areas.belly].some(area => covers(area, x + 0.5, y + 0.5))));
const dackel = buildBreed("dackel");
const tan = cells(marksOf("dackel", "tan"), "T");
const [browX, browY] = dackel.breed.areas.brow;
assert.ok(tan.some(([x, y]) => Math.abs(x - browX) <= 1 && y === browY), "tan above the eye");
assert.equal(dackel.breed.legs.lower, "T", "tan on the paws");
const mask = cells(marksOf("mops", "mask"), "M");
assert.ok(mask.length > 0 && mask.every(([x, y]) => covers(buildBreed("mops").breed.areas.muzzle, x + 0.5, y + 0.5)), "mask on the muzzle");
assert.ok(cells(marksOf("shiba", "sesame"), "S").length > 10, "sesame speckles");
assert.ok(cells(marksOf("corgi", "spots"), "X").length === 0, "only spotted breeds get spots");

// Spots: the same twice, the share of lattice cells with a spot near the setting, no run over 4 pixels
const dalmatiner = buildBreed("dalmatiner");
assert.deepEqual(markings(dalmatiner, "spots", spots).keys, markings(dalmatiner, "spots", spots).keys);
let candidates = 0;
let spotted = 0;
for (let seed = 1; seed <= 6; seed++) {
  const marks = markings(dalmatiner, "spots", { share: 0.42, seed });
  for (let row = 0; row < marks.height; row += 3) {
    for (let column = 0; column < marks.width; column += 3) {
      if (keyAt(dalmatiner.body, column, row) !== "O") continue;
      candidates++;
      if ([0, 1, 2].some(dy => [0, 1, 2].some(dx => keyAt(marks, column + dx, row + dy) === "X"))) spotted++;
    }
  }
  for (let y = 0; y < marks.height; y++) {
    let run = 0;
    for (let x = 0; x < marks.width; x++) {
      run = keyAt(marks, x, y) === "X" ? run + 1 : 0;
      assert.ok(run <= 4, `seed ${seed}: streak in row ${y}`);
    }
  }
  for (let x = 0; x < marks.width; x++) {
    let run = 0;
    for (let y = 0; y < marks.height; y++) {
      run = keyAt(marks, x, y) === "X" ? run + 1 : 0;
      assert.ok(run <= 4, `seed ${seed}: streak in column ${x}`);
    }
  }
}
assert.ok(Math.abs(spotted / candidates - 0.42) <= 0.08, `share ${spotted / candidates}`);

// The palette reads the four colors of the variant from the settings and maps the keys by pattern
const values = { corgiTricolorBase: "#c27c40", corgiTricolorMark: "#fbf6ee", corgiTricolorDark: "#1f1b1a", corgiTricolorNose: "#111111" };
const colors = coatPalette(values, "corgi", "tricolor");
assert.deepEqual(colors, { base: "#c27c40", mark: "#fbf6ee", dark: "#1f1b1a", nose: "#111111", pattern: "tri" });
const shared = { ink: "#2e1d14", eye: "#1d1412", tongue: "#e98a95", collar: "#c24535", tag: "#ffd23f", light: "#ffffff" };
const palette = dogPalette(colors, shared);
assert.equal(palette.S, "#1f1b1a", "tricolor saddle is the dark color");
assert.equal(palette.T, "#c27c40", "no tan points on a tricolor corgi");
assert.equal(palette.R, "#c24535");
assert.equal(dogPalette({ ...colors, pattern: "tan" }, shared).T, "#fbf6ee", "tan points in the mark color");
assert.equal(dogPalette({ ...colors, pattern: "mask" }, shared).M, "#1f1b1a");
assert.equal(dogPalette({ ...colors, pattern: "spots" }, shared).X, "#1f1b1a");
assert.equal(dogPalette({ ...colors, pattern: "sable" }, shared).S, "#79502f");

// Marked body: a copy with the markings, the body itself stays
const body = corgi.body;
const before = [...body.keys];
const marked = markedBody(body, marksOf("corgi", "tri"));
assert.deepEqual(body.keys, before);
assert.ok(marked.keys.includes("S"));

console.log("dogs coats ok");
