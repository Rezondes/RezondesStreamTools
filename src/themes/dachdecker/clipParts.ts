// Vanilla Three.js helper of the Dachdecker clips (the stinger): clips render outside React, so they free their scene
// themselves. Check: clipParts.check.ts.
import { type BufferGeometry, LineSegments, type Material, Mesh, type Object3D } from "three";

// Frees geometry and materials of every mesh and line set below object
export function disposeAll(object: Object3D) {
  object.traverse(child => {
    if (!(child instanceof Mesh || child instanceof LineSegments)) return;
    const shape: { geometry: BufferGeometry; material: Material | Material[] } = child;
    shape.geometry.dispose();
    for (const material of [shape.material].flat()) material.dispose();
  });
}
