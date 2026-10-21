// Check for house.ts of the Dachdecker theme: posts, windows, door, chimney and wreath in their places, smoke puffs over
// time. Runs with npm test.
import assert from "node:assert/strict";
import { house, puff } from "./house.ts";

const dims = { span: 8.4, rise: 3.25, trusses: 5, gap: 1.5, overhang: 0.12 };
const home = house(dims, 2.7);

// Posts at the four corners and between the windows on the front
assert.equal(home.posts.length, 7);
const corners = home.posts.filter(post => Math.abs(post.from[0]) > 3.9);
assert.equal(corners.length, 4);
assert.ok(home.posts.every(post => post.from[1] === 0 && post.to[1] === 2.7));
// Four windows and a door on the front, the windows between the posts, the door below the window line
assert.equal(home.windows.length, 4);
assert.ok(home.windows.every(window => window.center[2] > 0.2));
assert.ok(home.door.center[1] + home.door.size[1] / 2 <= 2.7);
// Chimney on the back roof face, wreath above the front gable, the roof on top of the walls
assert.ok(home.chimney.center[2] < -3 && home.chimney.center[0] > 0);
assert.ok(home.wreath[1] > 2.7 + 3.25 && home.wreath[2] > -0.5);
assert.equal(home.roofBase, 2.7);

// Smoke: nothing before a puff starts, it rises and fades, the same time gives the same puff
assert.equal(puff(3, 14, 1, 7), null);
const early = puff(0, 14, 0.5, 7)!;
const late = puff(0, 14, 5.5, 7)!;
assert.ok(late.offset[1] > early.offset[1] && late.scale > early.scale && late.opacity < early.opacity);
assert.deepEqual(puff(2, 14, 4, 7), puff(2, 14, 4, 7));

console.log("dachdecker house ok");
