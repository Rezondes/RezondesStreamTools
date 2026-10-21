// Edges of many instances in one line buffer (plans/PLAN-GRAFIK.md, package 3): the plan edges of hundreds of tiles are
// drawn with a single LineSegments instead of one object per tile.
import { type BufferGeometry, EdgesGeometry, type Matrix4, Vector3 } from "three";

export function mergedEdges(matrices: readonly Matrix4[], geometry: BufferGeometry): Float32Array {
  const edges = new EdgesGeometry(geometry);
  const base = edges.getAttribute("position").array;
  edges.dispose();
  const result = new Float32Array(matrices.length * base.length);
  const point = new Vector3();
  matrices.forEach((matrix, index) => {
    for (let offset = 0; offset < base.length; offset += 3) {
      point.set(base[offset], base[offset + 1], base[offset + 2]).applyMatrix4(matrix);
      result.set([point.x, point.y, point.z], index * base.length + offset);
    }
  });
  return result;
}
