// Check for clipWorld.ts: the watercolor world of the clips paints the sky, every cloud at its drift and the land, and
// the same drift gives the same picture. A mock canvas records everything. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { watercolorWorld } from "./clipWorld.ts";
import { cloudSpot, CLOUDS } from "./paint.ts";
import { worldAt } from "./render.ts";
import { bearsSettings, type BearsValues } from "./settings.ts";

function recorder() {
  const calls: unknown[][] = [];
  const gradient = { addColorStop: () => {} };
  const target: Record<string, unknown> = { createLinearGradient: () => gradient, createRadialGradient: () => gradient };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { calls.push([key, ...args]); }),
    set: () => true,
  });
  return { context: context as unknown as CanvasRenderingContext2D, calls };
}
const fakePath = (data: string) => data as unknown as Path2D;

const values = resolveSettings(bearsSettings, {}) as unknown as BearsValues;
const paint = watercolorWorld({ seed: 3, layers: 2, alpha: 0.3, roughness: 2.4, sketch: 0.35, grain: 0 }, { city: true, bridge: true, cave: true, flowers: true }, fakePath);
const at = (drift: number) => {
  const frame = recorder();
  paint(frame.context, worldAt(values, "mittag"), drift, "mittag");
  return frame.calls;
};

// Every cloud is moved to its spot for the drift
const spots = at(0.25).filter(call => call[0] === "translate").map(call => call.slice(1));
for (let index = 0; index < CLOUDS; index++) {
  const spot = cloudSpot(index, 0.25);
  assert.ok(spots.some(([x, y]) => x === spot.x && y === spot.y), `cloud ${index}`);
}
// The same drift, the same picture; another drift moves the clouds
assert.deepEqual(at(0.25), at(0.25));
assert.notDeepEqual(at(0.25), at(0.5));
assert.ok(at(0).filter(call => call[0] === "fill").length > 30);

console.log("bears clipWorld ok");
