// Check for clipParts.ts of the Dachdecker theme: the vanilla parts hold one object per beam, tiles split into slate and
// copper, the house with all its parts, a sky plane; freeing them works. Runs with npm test.
import assert from "node:assert/strict";
import { InstancedMesh } from "three";
import { disposeAll, frameObject, houseObject, skyPlane, tilesObject } from "./clipParts.ts";
import { roofFrame } from "./frame.ts";
import { house } from "./house.ts";
import { ridgeOf, tileLayout } from "./tiles.ts";

const dims = { span: 8.4, rise: 3.25, trusses: 5, gap: 1.5, overhang: 0.12 };
const colors = { accent: "#e67e22", line: "#ffffff", muted: "#b4c2e0", slate: "#2c3e50", copper: "#d4a373", brick: "#d35400", card: "#22356a", slateDark: "#1a252f" };

const frame = frameObject(dims, colors, 0.62, 0.1);
assert.equal(frame.children.length, roofFrame(dims).length);

const tiles = tileLayout(dims, 11, 7, 0.15, 2);
const roof = tilesObject(tiles, colors, ridgeOf(dims));
const counts = roof.children.filter(child => child instanceof InstancedMesh).map(mesh => (mesh as InstancedMesh).count);
assert.equal(counts.reduce((sum, count) => sum + count, 0), tiles.length);
assert.equal(roof.children.length, 4);

const home = house(dims, 2.7);
assert.equal(houseObject(home, colors, 0.62).children.length, 2 + home.posts.length + home.windows.length + 1);
assert.equal(skyPlane("#192a56", "#8a3d16", 100, 50).position.z, -50);

disposeAll(frame);
disposeAll(roof);

console.log("dachdecker clipParts ok");
