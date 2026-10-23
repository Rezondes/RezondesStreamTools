// Check that the values types generated from the Rust schemas (src/generated/themes) match the types of the
// TypeScript schemas (RUST-PLAN.md package 8). The proof is the type check itself: both directions must be
// assignable, so both have the same keys with the same types. Runs with npm test (and tsc in npm run verify).
import assert from "node:assert/strict";
import type { ChaosValues as GeneratedChaos } from "../generated/themes/chaos.ts";
import type { DachdeckerValues as GeneratedDachdecker } from "../generated/themes/dachdecker.ts";
import type { KebabValues as GeneratedKebab } from "../generated/themes/kebab.ts";
import type { MatrixValues as GeneratedMatrix } from "../generated/themes/matrix.ts";
import type { StandardValues as GeneratedStandard } from "../generated/themes/standard.ts";
import type { UrlaubValues as GeneratedUrlaub } from "../generated/themes/urlaub.ts";
import type { ChaosValues } from "./chaos/settings.ts";
import type { DachdeckerValues } from "./dachdecker/settings.ts";
import type { KebabValues } from "./kebab/settings.ts";
import type { MatrixValues } from "./matrix/settings.ts";
import type { StandardValues } from "./standard/settings.ts";
import type { UrlaubValues } from "./urlaub/settings.ts";

const standardFromRust = (values: GeneratedStandard): StandardValues => values;
const standardToRust = (values: StandardValues): GeneratedStandard => values;
const matrixFromRust = (values: GeneratedMatrix): MatrixValues => values;
const chaosFromRust = (values: GeneratedChaos): ChaosValues => values;
const chaosToRust = (values: ChaosValues): GeneratedChaos => values;
const matrixToRust = (values: MatrixValues): GeneratedMatrix => values;
const dachdeckerFromRust = (values: GeneratedDachdecker): DachdeckerValues => values;
const dachdeckerToRust = (values: DachdeckerValues): GeneratedDachdecker => values;
const kebabFromRust = (values: GeneratedKebab): KebabValues => values;
const kebabToRust = (values: KebabValues): GeneratedKebab => values;
// Urlaub: only this direction, the TypeScript type leaves out the fruit and fruit color fields that the schema adds
// after FIELDS, the generated type has every field
const urlaubFromRust = (values: GeneratedUrlaub): UrlaubValues => values;

assert.equal(typeof standardFromRust, "function");
assert.equal(typeof standardToRust, "function");
assert.equal(typeof matrixFromRust, "function");
assert.equal(typeof matrixToRust, "function");
assert.equal(typeof urlaubFromRust, "function");
assert.equal(typeof chaosFromRust, "function");
assert.equal(typeof chaosToRust, "function");
assert.equal(typeof dachdeckerFromRust, "function");
assert.equal(typeof dachdeckerToRust, "function");
assert.equal(typeof kebabFromRust, "function");
assert.equal(typeof kebabToRust, "function");

console.log("generatedValues ok");
