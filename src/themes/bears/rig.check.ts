// Check for rig.ts (skeleton of the bears): every pose has exactly two front and two hind limbs and no third arm, props
// follow their bone, the solver reaches its target, anchors lie in the box, feet stand on the ground, the headset covers
// the ears and the loud bear opens its mouth only when excited. Runs with npm test.
import assert from "node:assert/strict";
import { CLOSED_MOUTH, EAR_CENTERS, OPEN_MOUTH } from "./bears.ts";
import { POSE_NAMES, POSES, poseOf, solve, tube, TURN_LIMITS, type PoseName } from "./rig.ts";

// Every pose: front limbs (arms or front legs) and hind limbs exactly once each as one tube, each bone once
for (const name of POSE_NAMES) {
  const pose = POSES[name];
  const bones = pose.layers.map(layer => layer.bone);
  assert.equal(new Set(bones).size, bones.length, `${name}: a bone twice`);
  const front = pose.stance === "stand" ? ["nearArm", "farArm"] : ["nearFront", "farFront"];
  const hind = pose.stance === "stand" ? ["nearLeg", "farLeg"] : ["nearBack", "farBack"];
  for (const limb of [...front, ...hind]) {
    assert.equal(bones.filter(bone => bone === limb).length, 1, `${name}: ${limb}`);
    assert.equal(pose.layers.find(layer => layer.bone === limb)?.parts.filter(part => part.kind === "limb").length, 1, `${name}: ${limb} tubes`);
  }
  assert.equal(pose.layers.filter(layer => layer.body).length, 1, `${name}: one body`);
  for (const layer of pose.layers) for (const part of layer.parts) assert.match(part.d, /^M-?\d/, `${name}: ${part.d.slice(0, 16)}`);
  // Front paws drawn over a prop belong to an arm of the pose
  for (const bone of bones.filter(bone => bone.endsWith("Paw"))) assert.ok(bones.includes(bone.replace("Paw", "")), `${name}: ${bone}`);
}

// The solver reaches a target in reach, bends the joint at most a quarter of the reach off the line (no loop) and points
// straight at a target out of reach; a tube is closed for the fill only
{
  const [joint, end] = solve([0, 0], [0, 80], [50, 50]);
  assert.ok(Math.abs(end[1] - 80) < 0.1 && joint[0] > 0 && joint[0] <= 20.01, `joint ${joint.join(" ")}`);
  const [mild] = solve([0, 0], [0, 99], [50, 50]);
  assert.ok(mild[0] > 0 && mild[0] < 10);
  const [, far] = solve([0, 0], [0, 500], [50, 50]);
  assert.ok(Math.abs(far[1] - 100) < 0.1 && Math.abs(far[0]) < 0.1);
  const shape = tube([0, 0], [0, 50], [0, 100], 10);
  assert.ok(shape.fill.endsWith("Z") && !shape.line.endsWith("Z"));
}

// Props follow their bone: the phone sits at the near paw, the selfie phone at the raised paw
const propOf = (name: PoseName) => POSES[name].layers.find(layer => layer.bone === "prop");
assert.deepEqual(propOf("phone")?.pivot, POSES.phone.anchors.nearPaw);
assert.deepEqual(propOf("selfie")?.pivot, POSES.selfie.anchors.nearPaw);
assert.notDeepEqual(POSES.phone.anchors.nearPaw, POSES.selfie.anchors.nearPaw);
assert.equal(propOf("stand"), undefined);

// Anchors inside the box; feet on the ground (stand: two, four: four, the raised front leg is not a foot)
for (const name of POSE_NAMES) {
  const { anchors, width, height } = POSES[name];
  for (const [x, y] of [anchors.nearPaw, anchors.farPaw, anchors.top, anchors.back, ...anchors.feet]) assert.ok(x >= -20 && x <= width + 20 && y >= -10 && y <= height + 1, `${name}: ${x} ${y}`);
  // Standing on y 330 of 332, on all fours on the bottom of the box
  const ground = POSES[name].stance === "stand" ? height - 2 : height;
  for (const [, y] of anchors.feet) assert.ok(Math.abs(y - ground) <= 1.5, `${name}: foot at ${y}`);
}
assert.deepEqual([POSES.stand.anchors.feet.length, POSES.four.anchors.feet.length, POSES.fourWave.anchors.feet.length], [2, 4, 3]);
// Raised paws are high, held paws in front of the chest
assert.ok(POSES.wave.anchors.nearPaw[1] < 100 && POSES.fourWave.anchors.nearPaw[1] < 60);
assert.ok(POSES.phone.anchors.nearPaw[0] < 100);

// The headset: the near cup in front over the near ear, the band and the far cup behind the head over the far ear
const cupsOf = (bone: string) => (POSES.headphones.layers.find(layer => layer.bone === bone)?.parts ?? []).filter(part => part.kind === "prop" && part.d.includes(" A")).map(part => {
  const [left, y] = part.d.slice(1).split(" ").map(Number);
  const radius = Number(part.d.split("A")[1].trim().split(" ")[0]);
  return [left + radius, y, radius] as const;
});
const [farEar, nearEar] = EAR_CENTERS;
const covers = (cups: readonly (readonly [number, number, number])[], [x, y]: readonly [number, number]) => cups.some(([cx, cy, radius]) => Math.hypot(cx - x, cy - y) < radius);
assert.equal(cupsOf("headset").length, 1);
assert.ok(covers(cupsOf("headset"), nearEar) && covers(cupsOf("worn"), farEar));
assert.equal(POSES.headphones.layers.find(layer => layer.bone === "worn")?.parts.filter(part => part.kind === "prop").length, 2);

// The loud bear opens its mouth only in excited poses, the others keep the closed mouth; the thumb only on thumbs
const faceOf = (bear: "grizzly" | "eisbaer", name: PoseName) => (poseOf(bear, name).layers.find(layer => layer.bone === "head")?.parts ?? []).map(part => part.d);
assert.ok(faceOf("grizzly", "wave").includes(OPEN_MOUTH[0].d) && !faceOf("grizzly", "wave").includes(CLOSED_MOUTH.d));
assert.ok(faceOf("grizzly", "stand").includes(CLOSED_MOUTH.d) && faceOf("eisbaer", "wave").includes(CLOSED_MOUTH.d));
assert.ok(POSES.thumbs.layers.some(layer => layer.bone === "thumb") && !POSES.cheer.layers.some(layer => layer.bone === "thumb"));
// Thumbs up shows one paw in front, the thumb stands above it
assert.deepEqual(POSES.thumbs.layers.filter(layer => layer.bone.endsWith("Paw")).map(layer => layer.bone), ["nearArmPaw"]);
const thumbTop = Math.min(...(POSES.thumbs.layers.find(layer => layer.bone === "thumb")?.parts[1].d.match(/-?\d+(\.\d+)?/g) ?? []).filter((_, index) => index % 2 === 1).map(Number));
assert.ok(thumbTop < POSES.thumbs.anchors.nearPaw[1] - 25, `thumb top ${thumbTop}`);

// Holding: the far paw grips the prop from behind (drawn before it), the near paw is in front; one paw for the pan
const order = (name: PoseName) => POSES[name].layers.map(layer => layer.bone);
assert.ok(order("phone").indexOf("farArmPaw") < order("phone").indexOf("prop") && order("phone").indexOf("prop") < order("phone").indexOf("nearArmPaw"));
assert.ok(!order("cook").includes("farArmPaw") && !order("cheer").some(bone => bone.endsWith("Paw")));

// 2.5D: without a turn the near limbs are in front of the body and the far ones behind; turned toward the camera the
// face comes forward (moves toward the middle), the far arm stays behind; turns are clamped
for (const name of POSE_NAMES) {
  const bones = order(name);
  const body = bones.indexOf("body");
  for (const bone of bones) if (/^far(Arm|Leg|Back|Front)$/.test(bone)) assert.ok(bones.indexOf(bone) < body, `${name}: ${bone} in front`);
  for (const bone of bones) if (/^near(Arm|Leg|Back|Front)$/.test(bone)) assert.ok(bones.indexOf(bone) > body, `${name}: ${bone} behind`);
}
const noseX = (turn: number) => Number((poseOf("eisbaer", "stand", turn).layers.find(layer => layer.bone === "head")?.parts.find(part => part.kind === "nose")?.d ?? "M0").slice(1).split(" ")[0]);
assert.ok(noseX(0.5) > noseX(0) + 20, `nose ${noseX(0)} -> ${noseX(0.5)}`);
const turned = poseOf("eisbaer", "stand", 0.6).layers.map(layer => layer.bone);
assert.ok(turned.indexOf("farArm") < turned.indexOf("body"));
assert.equal(poseOf("eisbaer", "stand", 5).turn, TURN_LIMITS.toward);
assert.equal(poseOf("eisbaer", "stand", 0), POSES.stand);

console.log("bears rig ok");
