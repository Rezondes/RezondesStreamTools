// Check for clipParts.ts of the Dachdecker theme: freeing a scene disposes the geometry and the materials of every mesh
// and line set in it, also nested ones. Runs with npm test.
import assert from "node:assert/strict";
import { BoxGeometry, EdgesGeometry, Group, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial } from "three";
import { disposeAll } from "./clipParts.ts";

const freed: string[] = [];
const box = new BoxGeometry(1, 1, 1);
const mesh = new Mesh(box, [new MeshBasicMaterial(), new MeshBasicMaterial()]);
const lines = new LineSegments(new EdgesGeometry(box), new LineBasicMaterial());
const inner = new Group();
inner.add(lines);
const scene = new Group();
scene.add(mesh, inner);
for (const part of [mesh.geometry, lines.geometry, ...[mesh.material].flat(), lines.material]) part.addEventListener("dispose", () => freed.push(part.type));
disposeAll(scene);
assert.deepEqual(freed.sort(), ["BoxGeometry", "EdgesGeometry", "LineBasicMaterial", "MeshBasicMaterial", "MeshBasicMaterial"]);

console.log("dachdecker clipParts ok");
