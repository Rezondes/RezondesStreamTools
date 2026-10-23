// Check for chef.ts: all twelve parts, every point inside the grid of the logo, paper fills where parts hide lines,
// the knife crosses the meat. Runs with npm test.
import assert from "node:assert/strict";
import { CHEF_PARTS, chefParts, GRID, MEAT, pathPoints, toStage, VIEW } from "./chef.ts";

const parts = chefParts();

// Twelve parts, each with at least one ink line
assert.deepEqual(Object.keys(parts), [...CHEF_PARTS]);
for (const name of CHEF_PARTS) assert.ok(parts[name].lines.length > 0, `${name} has lines`);

// Every point of every line and fill lies in the grid
for (const name of CHEF_PARTS) {
  const shapes = [...parts[name].lines.map(line => line.shape), ...parts[name].fills.map(fill => ({ kind: "path" as const, d: fill }))];
  for (const shape of shapes) {
    const points = shape.kind === "path" ? pathPoints(shape.d) : shape.kind === "ellipse" ? [{ x: shape.x, y: shape.y }] : [];
    for (const point of points) assert.ok(point.x >= 0 && point.x <= GRID.width && point.y >= 0 && point.y <= GRID.height, `${name} point ${point.x}/${point.y}`);
  }
}

// Hat, arm, knife, meat and moustache hide what lies behind them
for (const name of ["hat", "arm", "knife", "meat", "stache"] as const) assert.ok(parts[name].fills.length > 0, `${name} has a paper fill`);
assert.equal(parts.counter.fills.length, 0);

// The blade reaches from left of the meat to right of it
const meatX = pathPoints(MEAT).map(point => point.x);
const bladeX = pathPoints(parts.knife.fills[0]).map(point => point.x);
assert.ok(Math.min(...bladeX) < Math.min(...meatX) && Math.max(...bladeX) > Math.max(...meatX), "the knife crosses the meat");

// Eyes have two filled pupils, the jacket six open buttons
assert.equal(parts.eyes.dots.filter(dot => dot.filled).length, 2);
assert.equal(parts.body.dots.filter(dot => !dot.filled).length, 6);
assert.deepEqual(pathPoints("M1 2 L3 4.5"), [{ x: 1, y: 2 }, { x: 3, y: 4.5 }]);
assert.deepEqual(pathPoints(""), []);

// The view of the grid maps onto the logo box of the stage: its corners land on the box
const corner = toStage({ x: VIEW.x, y: VIEW.y });
assert.deepEqual({ x: corner.x, y: corner.y }, { x: 120, y: 60 });
const far = toStage({ x: VIEW.x + VIEW.width, y: VIEW.y + VIEW.height });
assert.ok(Math.abs(far.y - 1000) < 1e-9 && Math.abs(far.x - (120 + VIEW.width * far.scale)) < 1e-9);

console.log("kebab chef ok");
