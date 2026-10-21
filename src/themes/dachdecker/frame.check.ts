// Check for frame.ts of the Dachdecker theme: beams per truss, purlins, battens and wall plates, inside the roof and
// in the order of the build. Runs with npm test.
import assert from "node:assert/strict";
import { BUILD_ORDER, roofFrame, sketchLines } from "./frame.ts";

const beams = roofFrame({ span: 8.4, rise: 3.25, trusses: 5, gap: 1.5, overhang: 0.12 });
const count = (kind: string) => beams.filter(beam => beam.kind === kind).length;

// Roof frame: 7 beams per truss, the first truss is the front one
assert.equal(count("front") + count("truss"), 35);
assert.equal(count("front"), 7);
assert.equal(count("purlin"), 5);
assert.equal(count("plate"), 2);
assert.ok(count("batten") >= 8, "battens along the rafter");

// All points inside span times overhang and the ridge height
for (const beam of beams) {
  for (const [x, y] of [beam.from, beam.to]) {
    assert.ok(Math.abs(x) <= 4.2 * 1.12 + 1e-9, `x ${x}`);
    assert.ok(y >= -0.6 && y <= 3.3, `y ${y}`);
  }
}

// order rises in the build: wall plates, front truss, trusses, purlins, battens
const kinds = [...beams].sort((first, second) => first.order - second.order).map(beam => beam.kind);
const steps = kinds.map(kind => BUILD_ORDER.indexOf(kind));
assert.deepEqual(steps, [...steps].sort((first, second) => first - second));
assert.ok(beams.filter(beam => beam.kind === "truss").every(beam => beam.order > 1));

// More trusses, more beams; the depth follows the gap
const wide = roofFrame({ span: 8.4, rise: 3.25, trusses: 3, gap: 2, overhang: 0 });
assert.equal(wide.filter(beam => beam.kind === "front" || beam.kind === "truss").length, 21);
assert.equal(Math.min(...wide.filter(beam => beam.kind === "truss").map(beam => beam.from[2])), -4);

// The flat sketch: one line per beam; deeper trusses lie to the right and higher up (smaller y)
const sketch = sketchLines(beams);
assert.equal(sketch.length, beams.length);
const peakOf = (kind: string) => sketch.filter(line => line.kind === kind).map(line => line.to).sort((first, second) => first[1] - second[1])[0];
assert.ok(peakOf("truss")[0] > peakOf("front")[0] && peakOf("truss")[1] < peakOf("front")[1]);

console.log("dachdecker frame ok");
