// Check for world.ts of the Plantage theme: the layers from far to near move more with the camera and get sharper and
// clearer; the same seed gives the same world; hill lines are closed polygons; sunrise and camera from the time.
// Runs with npm test.
import assert from "node:assert/strict";
import { cameraAt, cloudSpots, daylight, cloudX, crate, furrows, grassTufts, hillLine, HILLS, sunriseAt, worldLayers } from "./world.ts";

const OPTIONS = { seed: 42, treeRowsFar: 11, treeRowsMid: 8, farBlur: 1.5, hazeFar: 0.55 };

// Ebenen: far to near, more camera movement, less blur and less haze; same seed, same world
const layers = worldLayers(OPTIONS);
assert.deepEqual(layers.map(layer => layer.id), ["clouds", "hillsFar", "hillsNear", "treesFar", "treesMid", "field", "treesNear", "front"]);
for (let index = 1; index < layers.length; index++) {
  assert.ok(layers[index].move > layers[index - 1].move, `${layers[index].id} moves more`);
  assert.ok(layers[index].blur <= layers[index - 1].blur, `${layers[index].id} sharper`);
  assert.ok(layers[index].haze <= layers[index - 1].haze, `${layers[index].id} clearer`);
}
assert.equal(layers[layers.length - 1].haze, 0);
assert.deepEqual(worldLayers(OPTIONS), layers);
assert.notDeepEqual(worldLayers({ ...OPTIONS, seed: 7 }).find(layer => layer.id === "treesFar"), layers.find(layer => layer.id === "treesFar"));
assert.equal(layers.find(layer => layer.id === "treesFar")?.trees.length, 11);
assert.equal(layers.find(layer => layer.id === "treesMid")?.trees.length, 8);
assert.equal(worldLayers({ ...OPTIONS, hazeFar: 1 }).every(layer => layer.haze <= 1), true);

// Shapes
const hill = hillLine(HILLS.far);
assert.equal(hill.length % 2, 0);
assert.equal(hill[1], 1080);
assert.equal(hill[hill.length - 1], 1080);
assert.ok(furrows().every(quad => quad.length === 8));
assert.deepEqual(grassTufts(42, 16), grassTufts(42, 16));
assert.equal(grassTufts(42, 16).length, 16);
assert.ok(cloudX(260, 0, 0) > cloudX(260, 0, -10));
assert.equal(cloudSpots(8).length, 8);
assert.deepEqual(cloudSpots(4)[0], { x: 260, y: 210, size: 1 });
const box = crate({ wood: "#c8935a", woodDark: "#7a4a24", shadow: "#3a220f", mango: "#ffb02e", mangoBlush: "#ff5e3a", gloss: "#fff6df" });
assert.ok(box.some(shape => shape.color === "#ffb02e") && box.some(shape => shape.color === "#7a4a24"));

// Time: dawn to morning, camera from -1 to 1 and back
assert.equal(sunriseAt(0, 3200, true), 0);
assert.equal(sunriseAt(1.6, 3200, true), 0.5);
assert.equal(sunriseAt(9, 3200, true), 1);
assert.equal(sunriseAt(0, 3200, false), 1);
assert.equal(sunriseAt(0, 0, true), 1);
assert.equal(cameraAt(0, 14, true), -1);
assert.ok(Math.abs(cameraAt(14, 14, true) - 1) < 1e-9);
assert.ok(Math.abs(cameraAt(28, 14, true) + 1) < 1e-9);
assert.equal(cameraAt(5, 14, false), 0);

// Light per screen: dawn brightens, noon is full day, the sunset sinks the sun and darkens
const LIGHT = { sunriseMs: 3200, sunriseOn: true, sunsetMs: 4000, sunsetOn: true };
assert.deepEqual(daylight("starting", 0, LIGHT), { sky: 0, sun: 0, bright: 0.55 });
assert.deepEqual(daylight("starting", 10, LIGHT), { sky: 1, sun: 1, bright: 1 });
assert.equal(daylight("brb", 3, LIGHT).bright, 1);
assert.ok(daylight("brb", 3, LIGHT).sun > daylight("starting", 10, LIGHT).sun, "noon sun stands higher");
assert.deepEqual(daylight("ending", 0, LIGHT), { sky: 0, sun: 1, bright: 1 });
const dusk = daylight("ending", 10, LIGHT);
assert.ok(dusk.sky === 1 && dusk.sun === 0 && dusk.bright < 1, "the sunset ends dark with the sun down");
assert.deepEqual(daylight("ending", 10, { ...LIGHT, sunsetOn: false }), { sky: 0, sun: 1, bright: 1 });

console.log("plantage world ok");
