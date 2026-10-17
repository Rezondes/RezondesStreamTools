// Check that the values types generated from the Rust schemas (src/generated/themes) match the types of the
// TypeScript schemas (RUST-PLAN.md package 8). The proof is the type check itself: both directions must be
// assignable, so both have the same keys with the same types. Runs with npm test (and tsc in npm run verify).
import assert from "node:assert/strict";
import type { MatrixValues as GeneratedMatrix } from "../generated/themes/matrix.ts";
import type { StandardValues as GeneratedStandard } from "../generated/themes/standard.ts";
import type { SuedfruchtValues as GeneratedSuedfrucht } from "../generated/themes/suedfrucht.ts";
import type { MatrixValues } from "./matrix/settings.ts";
import type { StandardValues } from "./standard/settings.ts";
import type { SuedfruchtValues } from "./suedfrucht/settings.ts";

const standardFromRust = (values: GeneratedStandard): StandardValues => values;
const standardToRust = (values: StandardValues): GeneratedStandard => values;
const matrixFromRust = (values: GeneratedMatrix): MatrixValues => values;
const matrixToRust = (values: MatrixValues): GeneratedMatrix => values;
// Südfrucht: only this direction, the TypeScript type leaves out the fruit and fruit color fields that the schema adds
// after FIELDS, the generated type has every field
const suedfruchtFromRust = (values: GeneratedSuedfrucht): SuedfruchtValues => values;

assert.equal(typeof standardFromRust, "function");
assert.equal(typeof standardToRust, "function");
assert.equal(typeof matrixFromRust, "function");
assert.equal(typeof matrixToRust, "function");
assert.equal(typeof suedfruchtFromRust, "function");

console.log("generatedValues ok");
