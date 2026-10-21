// Check for banners.ts of the Dachdecker theme: drops of the offline banner loop seamlessly, the scenes build and update
// the same way for the same time. Runs with npm test.
import assert from "node:assert/strict";
import { dropHeight, offlineSetup, profileSetup } from "./banners.ts";

// Seamless loop: at 0 and at the loop length every drop is in the same place, in between it moved
for (let index = 0; index < 50; index++) {
  assert.ok(Math.abs(dropHeight(index, 0, 4, 7) - dropHeight(index, 4, 4, 7)) < 1e-9, `drop ${index}`);
  assert.ok(dropHeight(index, 1.3, 4, 7) >= 0 && dropHeight(index, 1.3, 4, 7) <= 14);
}
assert.notEqual(dropHeight(3, 1, 4, 7), dropHeight(3, 0, 4, 7));

const colors = {
  accent: "#e67e22", line: "#ffffff", muted: "#b4c2e0", slate: "#2c3e50", copper: "#d4a373", brick: "#d35400", card: "#22356a", slateDark: "#1a252f",
  blueprint: "#192a56", page: "#121e40", dusk: "#8a3d16", rainColor: "#7fe3ff",
};
const options = { dims: { span: 8.4, rise: 3.25, trusses: 5, gap: 1.5, overhang: 0.12 }, wallHeight: 2.7, seed: 7, copperShare: 0.15, lineOpacity: 0.62, fillOpacity: 0.1, loop: 4, rain: true, drops: 200, colors };
const pose = (setup: typeof offlineSetup, time: number) => {
  const built = setup(options);
  built.update(time);
  const result = built.camera.position.toArray();
  built.dispose?.();
  return result;
};
assert.deepEqual(pose(offlineSetup, 1.5), pose(offlineSetup, 1.5));
const start = pose(offlineSetup, 0);
pose(offlineSetup, 4).forEach((value, axis) => assert.ok(Math.abs(value - start[axis]) < 1e-9));
assert.deepEqual(pose(profileSetup, 2), pose(profileSetup, 2));

console.log("dachdecker banners ok");
