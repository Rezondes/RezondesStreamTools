// Check for particles.ts: motion and aging follow dt, dead particles are removed. Runs with npm test.
import assert from "node:assert/strict";
import { type Particle, stepParticles } from "./particles.ts";

const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
const spark: Particle = { x: 0, y: 0, vx: 2, vy: -5, life: 1, decay: 0.1, gravity: 0.3, drag: 1 };

// Two steps of 1 equal one step of 2 without drag
const twice = stepParticles(stepParticles([spark], 1), 1)[0];
const once = stepParticles([spark], 2)[0];
for (const key of ["x", "y", "vx", "vy", "life"] as const) close(twice[key], once[key]);
close(once.x, 4);
close(once.y, -10 + 0.6);
close(once.vy, -5 + 0.6);
close(once.life, 0.8);

// Drag slows down per frame
const slowed = stepParticles([{ ...spark, drag: 0.5 }], 2)[0];
close(slowed.vx, 0.5);

// A particle at the end of its life is removed, the list itself stays unchanged
const list = [spark, { ...spark, life: 0.05 }];
assert.equal(stepParticles(list, 1).length, 1);
assert.equal(list.length, 2);

console.log("particles ok");
