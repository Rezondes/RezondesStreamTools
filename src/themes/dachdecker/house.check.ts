// Check for house.ts of the Dachdecker theme: timber frame, windows with sills, door with step, gables, chimney and
// wreath in their places, no timber across the door, smoke puffs over time. Runs with npm test.
import assert from "node:assert/strict";
import { house, puff } from "./house.ts";

const dims = { span: 8.4, rise: 3.25, trusses: 5, gap: 1.5, overhang: 0.12 };
const home = house(dims, 2.7);
const width = home.wall.size[0] / 2;

// Timbers: corner posts on all four corners, every timber inside the wall height
const posts = home.timbers.filter(timber => timber.from[0] === timber.to[0] && timber.from[2] === timber.to[2]);
const atCorner = (post: (typeof posts)[number]) => Math.abs(Math.abs(post.from[0]) - width) < 0.1 && Math.abs(post.from[2] - home.wall.center[2]) > 1;
assert.equal(posts.filter(atCorner).length, 4);
assert.ok(home.timbers.every(timber => [timber.from[1], timber.to[1]].every(y => y >= 0 && y <= 2.7)));
// Nothing stands or runs through the door opening on the front
const doorHalf = home.door.size[0] / 2;
const doorTop = home.door.center[1] + home.door.size[1] / 2;
const front = home.timbers.filter(timber => timber.from[2] > 0 && timber.to[2] > 0);
assert.ok(front.every(timber => {
  const [left, right] = [Math.min(timber.from[0], timber.to[0]), Math.max(timber.from[0], timber.to[0])];
  const low = Math.min(timber.from[1], timber.to[1]);
  return right <= -doorHalf || left >= doorHalf || low >= doorTop;
}), "a timber crosses the door");
// Four windows with their sills on the front, the door below the window line and its step on the ground in front of it
assert.equal(home.windows.length, 4);
assert.equal(home.sills.length, 4);
assert.ok(home.windows.every((window, index) => window.center[2] > 0.2 && home.sills[index].center[1] < window.center[1] - window.size[1] / 2));
assert.ok(doorTop <= 2.7);
assert.ok(home.step.center[1] - home.step.size[1] / 2 === 0 && home.step.center[2] > home.door.center[2]);
// Closed gables front and back under the rafters, each with a round window inside the triangle
assert.equal(home.gables.length, 2);
assert.ok(home.gables.every(gable => gable.base === 2.7 && gable.rise <= 3.25 && gable.window.center[1] - gable.window.radius > 2.7));
// Chimney on the back roof face, wreath above the ridge at the front, the roof on top of the walls
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
