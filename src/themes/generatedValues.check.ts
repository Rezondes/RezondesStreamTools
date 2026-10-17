// Check that the values types generated from the Rust schemas (src/generated/themes) match the types of the
// TypeScript schemas (RUST-PLAN.md package 8). The proof is the type check itself: both directions must be
// assignable, so both have the same keys with the same types. Runs with npm test (and tsc in npm run verify).
import assert from "node:assert/strict";
import type { StandardValues as GeneratedStandard } from "../generated/themes/standard.ts";
import type { StandardValues } from "./standard/settings.ts";

const standardFromRust = (values: GeneratedStandard): StandardValues => values;
const standardToRust = (values: StandardValues): GeneratedStandard => values;

assert.equal(typeof standardFromRust, "function");
assert.equal(typeof standardToRust, "function");

console.log("generatedValues ok");
