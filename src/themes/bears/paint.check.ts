// Check for paint.ts (the character model on a canvas): every bear and the tower draw their body, panda patches only for
// the panda, colors mix as expected, the world draws sky and land. A mock canvas records everything. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { POSES } from "./bears.ts";
import { drawBear, drawHero, drawWorld, mix, TOWER_SIZE } from "./paint.ts";
import { paletteOf, worldOf } from "./render.ts";
import { bearsSettings, type BearsValues } from "./settings.ts";

// One gradient for all recordings, so equal pictures give equal calls
const gradient = { addColorStop: () => {} };

function recorder() {
  const calls: unknown[][] = [];
  const target: Record<string, unknown> = { measureText: () => ({ width: 300 }), createLinearGradient: () => gradient, createRadialGradient: () => gradient };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { calls.push([key, ...args]); }),
    set: (_, key: string, value) => { calls.push([`set ${key}`, value]); return true; },
  });
  return { context: context as unknown as CanvasRenderingContext2D, calls };
}

const values = resolveSettings(bearsSettings, {}) as unknown as BearsValues;
const palette = paletteOf(values);
const fills = (calls: unknown[][]) => calls.filter(call => call[0] === "fill").map(call => call[1]);

// Mixing hex colors
assert.equal(mix("#000000", "#ffffff", 0.5), "#808080");
assert.equal(mix("#102030", "#102030", 0.3), "#102030");

// A bear fills its body, the panda also its patches, the others not
for (const bear of ["eisbaer", "grizzly", "panda"] as const) {
  const frame = recorder();
  drawBear(frame.context, bear, "stand", 100, 300, 300, palette);
  assert.ok(fills(frame.calls).includes(POSES.stand.body), bear);
  assert.equal(fills(frame.calls).includes(POSES.stand.patches[0]), bear === "panda", bear);
}

// The tower draws two bodies on all fours and the top one on three legs; an unknown choice draws the Grizzly
const tower = recorder();
drawHero(tower.context, "turm", { eisbaer: "stand", grizzly: "stand", panda: "stand" }, 500, 900, 600, palette);
assert.equal(fills(tower.calls).filter(path => path === POSES.four.body).length, 2);
assert.equal(fills(tower.calls).filter(path => path === POSES.fourWave.body).length, 1);
assert.ok(TOWER_SIZE.height > POSES.four.height);
// Bottom level first and lowest: every bear stands higher than the one before (each bear translates twice)
const feet = tower.calls.filter(call => call[0] === "translate").map(call => call[2] as number).filter((_, index) => index % 2 === 0);
assert.ok(feet[0] === 900 && feet[0] > feet[1] && feet[1] > feet[2], `feet ${feet.join(", ")}`);
const unknown = recorder();
drawHero(unknown.context, "koala", { eisbaer: "stand", grizzly: "wave", panda: "stand" }, 0, 0, 100, palette);
assert.ok(fills(unknown.calls).includes(POSES.wave.body));

// The world: sky over the whole picture, then land
const world = recorder();
drawWorld(world.context, worldOf(values, values.skyDayTop, values.skyDayBottom, values.sun), 0, [980, 150], false);
assert.ok(world.calls.some(call => call[0] === "fillRect"));
assert.ok(fills(world.calls).length > 10);

console.log("bears paint ok");
