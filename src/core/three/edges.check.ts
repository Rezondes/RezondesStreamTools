// Check for edges.ts: n matrices give n times the edge points of a geometry, transformed. Runs with npm test.
import assert from "node:assert/strict";
import { BoxGeometry, EdgesGeometry, Matrix4 } from "three";
import { mergedEdges } from "./edges.ts";

const box = new BoxGeometry(1, 1, 1);
const perBox = new EdgesGeometry(box).getAttribute("position").array.length;
assert.equal(perBox, 12 * 2 * 3);

const merged = mergedEdges([new Matrix4().makeTranslation(1, 0, 0), new Matrix4().makeTranslation(2, 0, 0)], box);
assert.equal(merged.length, perBox * 2);

// First box spans x 0.5 to 1.5, second 1.5 to 2.5
const xs = (from: number, to: number) => Array.from(merged.slice(from, to)).filter((_, index) => index % 3 === 0);
assert.deepEqual([Math.min(...xs(0, perBox)), Math.max(...xs(0, perBox))], [0.5, 1.5]);
assert.deepEqual([Math.min(...xs(perBox, perBox * 2)), Math.max(...xs(perBox, perBox * 2))], [1.5, 2.5]);

assert.equal(mergedEdges([], box).length, 0);

console.log("edges ok");
