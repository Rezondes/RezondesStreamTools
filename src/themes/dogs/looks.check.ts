// Check of looks.ts: world, prop and dog colors come from the settings; a coat the breed does not have gives its
// default coat; the share of spots is a fraction. Run: node src/themes/dogs/looks.check.ts
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { dogLookOf, propColorsOf, worldColorsOf } from "./looks.ts";
import { dogsSettings, type DogsValues } from "./settings.ts";

const values = resolveSettings(dogsSettings, { sky: "#010203", accent: "#040506", hillColor2: "#070809" }) as unknown as DogsValues;
const world = worldColorsOf(values);
assert.equal(world.sky, "#010203");
assert.deepEqual(world.hills, ["#93d26e", "#070809", "#7cbf5a"]);
assert.equal(world.flowers.length, 4);
assert.equal(propColorsOf(values).accent, "#040506");

const corgi = dogLookOf(values, "corgi", "tricolor");
assert.equal(corgi.colors.pattern, "tri");
assert.equal(corgi.shared.collar, "#040506");
assert.equal(corgi.spots.share, 0.42);
assert.equal(dogLookOf(values, "mops", "tricolor").colors.base, "#d9bb8b", "the default coat of the mops");

console.log("dogs looks ok");
