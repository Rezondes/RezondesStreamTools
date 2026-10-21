// Roof frame of the Dachdecker theme as data (src/themes/dachdecker/docs/PLAN-DACHDECKER.md, package 1): every beam with
// its ends in metres, thickness, kind and its step in the build. The front truss stands at z 0, the others behind it at
// -gap, -2 gap and so on. Scenes and clips draw the same list. Check: frame.check.ts.
import type { Point3 } from "../../core/three/beam.ts";

export type FrameDims = { span: number; rise: number; trusses: number; gap: number; overhang: number };
export type BeamKind = "plate" | "front" | "truss" | "purlin" | "batten";
export type Beam = { from: Point3; to: Point3; size: number; kind: BeamKind; order: number };

// Steps of the build in this order; order of a beam: plates 0, front truss 1, truss n 1 + n, purlins and battens after
export const BUILD_ORDER: readonly BeamKind[] = ["plate", "front", "truss", "purlin", "batten"];

// Thickness of the beams in metres (the box is 2.2 times as high as wide)
const RAFTER = 0.1;
const COLLAR = 0.08;
const STRUT = 0.07;
const PURLIN = 0.11;
const BATTEN = 0.04;
const PLATE = 0.3;
// Collar beam on 58 % of the height, struts to the middle of the rafters
const COLLAR_AT = 0.58;
const STRUT_AT = 0.5;
// Purlins lie a little above the rafter line; wall plates below the eaves; beams along the depth stick out at both ends
const PURLIN_LIFT = 0.04;
const BATTEN_LIFT = 0.2;
const PLATE_Y = -0.6;
const OUTSIDE = 0.5;
const PLATE_OUTSIDE = 0.7;
// Battens every 8.5 % of the rafter, from 10 % to below 98 %
const BATTEN_FROM = 0.1;
const BATTEN_STEP = 0.085;
const BATTEN_TO = 0.98;

const mix = (from: Point3, to: Point3, part: number): Point3 => [
  from[0] + (to[0] - from[0]) * part, from[1] + (to[1] - from[1]) * part, from[2] + (to[2] - from[2]) * part,
];

// Depth of the frame from the front to the last truss
export const frameDepth = (dims: FrameDims) => (Math.max(1, Math.round(dims.trusses)) - 1) * dims.gap;

function truss(dims: FrameDims, depth: number, index: number): Beam[] {
  const half = dims.span / 2;
  const left: Point3 = [-half, 0, depth];
  const right: Point3 = [half, 0, depth];
  const peak: Point3 = [0, dims.rise, depth];
  const middle: Point3 = [0, 0, depth];
  // Rafters go from the peak past the wall by the overhang
  const eave = (wall: Point3) => mix(peak, wall, 1 + dims.overhang);
  const kind: BeamKind = index === 0 ? "front" : "truss";
  const order = 1 + index;
  const beam = (from: Point3, to: Point3, size: number): Beam => ({ from, to, size, kind, order });
  return [
    beam(eave(left), peak, RAFTER),
    beam(eave(right), peak, RAFTER),
    beam(left, right, RAFTER),
    beam(mix(left, peak, COLLAR_AT), mix(right, peak, COLLAR_AT), COLLAR),
    beam(middle, peak, COLLAR),
    beam(middle, mix(left, peak, STRUT_AT), STRUT),
    beam(middle, mix(right, peak, STRUT_AT), STRUT),
  ];
}

export function roofFrame(dims: FrameDims): Beam[] {
  const count = Math.max(1, Math.round(dims.trusses));
  const half = dims.span / 2;
  const back = -frameDepth(dims);
  const purlinOrder = 1 + count;
  const along = (x: number, y: number, size: number, kind: BeamKind, order: number, outside = OUTSIDE): Beam => ({
    from: [x, y, outside], to: [x, y, back - outside], size, kind, order,
  });
  const plates = [-half, half].map(x => along(x, PLATE_Y, PLATE, "plate", 0, PLATE_OUTSIDE));
  const trusses = Array.from({ length: count }, (_, index) => truss(dims, -index * dims.gap, index)).flat();
  // Purlins at the ridge, both eaves and the middle of both rafters
  const purlins = ([[0, dims.rise], [-half, 0], [half, 0], [-half / 2, dims.rise / 2], [half / 2, dims.rise / 2]] as const)
    .map(([x, y]) => along(x, y + PURLIN_LIFT, PURLIN, "purlin", purlinOrder));
  // Battens on the left roof face; the right one gets the tiles first
  const battens: Beam[] = [];
  for (let part = BATTEN_FROM; part < BATTEN_TO; part += BATTEN_STEP) {
    battens.push(along(-half + half * part, dims.rise * part + BATTEN_LIFT * (1 - part), BATTEN, "batten", purlinOrder + 1));
  }
  return [...plates, ...trusses, ...purlins, ...battens];
}
