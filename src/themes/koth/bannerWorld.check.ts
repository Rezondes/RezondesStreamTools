// Check for bannerWorld.ts: the banner scene holds ground, mast, flag and the pines and rocks of the settings, and the
// camera looks at the hill from its circle. Runs with npm test (scene graph only, no WebGL).
import assert from "node:assert/strict";
import type { PerspectiveCamera } from "three";
import { type BannerWorldOptions, bannerSetup } from "./bannerWorld.ts";

const options: BannerWorldOptions = {
  seed: 301, hillHeight: 7.2, mastHeight: 9.5, trees: 10, rocks: 4, radius: 40, height: 12, sky: { top: "#5d4a3a", horizon: "#f3dcb0" }, light: "#ffd29a",
  colors: { sand: "#b9a06a", hill: "#6b7a3a", shade: "#4a5628", mountain: "#6b7280", steel: "#3c4146", pine: "#4a5628", rock: "#7d786a", flag: "#2f6fd6" },
};
const setup = bannerSetup({ width: 1200, height: 480 }, options);
for (const name of ["ground", "mast", "flag"]) assert.ok(setup.scene.getObjectByName(name), name);
// sky, 16 mountains, ground, mast, flag, pines and rocks
const meshes = setup.scene.children.filter(child => child.type === "Mesh" || child.type === "LineSegments");
assert.equal(meshes.length, 1 + 16 + 1 + 1 + 1 + options.trees + options.rocks);
// The camera stands on its circle and looks down at the hill
const camera = setup.camera as PerspectiveCamera;
assert.ok(Math.abs(Math.hypot(camera.position.x, camera.position.z) - options.radius) < 1e-6);
assert.equal(camera.aspect, 1200 / 480);
assert.ok(camera.position.y > options.hillHeight);
setup.update(0);
setup.dispose?.();

console.log("koth bannerWorld ok");
