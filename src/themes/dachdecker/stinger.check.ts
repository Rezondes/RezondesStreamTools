// Check for stinger.ts of the Dachdecker theme: the scene follows the roll of roll.ts (the roll sits at its x and is
// hidden off the picture) and the same time gives the same scene. Runs with npm test.
import assert from "node:assert/strict";
import { rollAt } from "./roll.ts";
import { stingerSetup } from "./stinger.ts";

const options = { duration: 2.4, cut: 1.2, hold: 0.2, roll: 180, grid: 40, blueprint: "#192a56", line: "#ffffff", accent: "#e67e22", copper: "#d4a373", shadow: "#121e40" };
const state = (time: number) => {
  const built = stingerSetup(options);
  built.update(time);
  const result = built.scene.children.map(child => [child.position.x, child.scale.x, child.rotation.y, child.visible]);
  built.dispose?.();
  return result;
};
assert.deepEqual(state(0.8), state(0.8));
// The roll is the only scaled child: it stands at the x of the roll and is hidden while the sheet covers everything
const roll = (time: number) => state(time).find(([, scale]) => scale !== 1)!;
assert.equal(roll(0.5)[0], rollAt(0.5, options).x);
assert.equal(roll(options.cut)[3], false);

console.log("dachdecker stinger ok");
