// Check of areas.ts: the Dogs theme keeps the default sizes of every OBS source for now.
// Run: node src/themes/dogs/areas.check.ts
import assert from "node:assert/strict";
import { dogsAreas } from "./areas.ts";

assert.deepEqual(dogsAreas(), {});

console.log("dogs areas ok");
