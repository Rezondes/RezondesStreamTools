/* eslint-disable -- reference prototype outside the build (THEMES.md, docs/refs), not held to the code rules */
// Procedural plush dogs: breeds from soft primitives, coat markings in the fragment shader (colors are uniforms,
// so every coat color is a setting), a small rig (torso pivot at the rear hip, 2-bone IK legs, head, ears, tail chain)
// and a pose(state) that is a pure function of its inputs.
import * as THREE from 'three';

export const COLLAR = '#c94a3a';

const PART = { body: 0, neck: 1, head: 2, muzzle: 3, jaw: 4, ear: 5, earInner: 6, leg: 7, paw: 8, tail: 9 };
const PATTERN = { solid: 0, tan: 1, white: 2, tri: 3, sable: 4, urajiro: 5, urajiroTan: 6, sesame: 7, mask: 8, spots: 9 };

// Proportions in "metres" of a stylised dog, slightly puppy-like (bigger heads and eyes).
export const BREEDS = {
  labrador: {
    name: 'Labrador', leg: 0.6, len: 1.1, r: 0.3, h: 0.31, head: 0.27, muzzleLen: 0.27, muzzleR: 0.12, neck: 0.2,
    ear: 'flop', earLen: 0.25, tail: 'otter', tailLen: 0.52, tailR: 0.065, legR: 0.075,
    coats: {
      gelb: { name: 'Gelb', pattern: 'solid', base: '#e3bf86', mark: '#f2dcb4', dark: '#c99a5e', nose: '#2a1d18', inner: '#e8b9a0' },
      schwarz: { name: 'Schwarz', pattern: 'solid', base: '#1e1b1a', mark: '#2a2523', dark: '#141212', nose: '#111111', inner: '#3a2c2a' },
      braun: { name: 'Schokobraun', pattern: 'solid', base: '#6a3f27', mark: '#7a4b31', dark: '#4a2a19', nose: '#3d2419', inner: '#8a5a48' },
    },
  },
  dackel: {
    name: 'Dackel', leg: 0.26, len: 1.18, r: 0.21, h: 0.22, head: 0.22, muzzleLen: 0.25, muzzleR: 0.09, neck: 0.2,
    ear: 'longflop', earLen: 0.25, tail: 'thin', tailLen: 0.42, tailR: 0.04, legR: 0.06,
    coats: {
      rot: { name: 'Rot', pattern: 'solid', base: '#b4602f', mark: '#c2743f', dark: '#7f3e1c', nose: '#1d1715', inner: '#c98a70' },
      schwarzrot: { name: 'Schwarz-Rot', pattern: 'tan', base: '#1f1917', mark: '#b5683a', dark: '#141110', nose: '#111111', inner: '#3a2c2a' },
      schokorot: { name: 'Schoko-Rot', pattern: 'tan', base: '#55301f', mark: '#c07a45', dark: '#3a2015', nose: '#3a2218', inner: '#7a4a3a' },
    },
  },
  corgi: {
    name: 'Corgi', leg: 0.29, len: 1.0, r: 0.27, h: 0.27, head: 0.25, muzzleLen: 0.17, muzzleR: 0.1, neck: 0.15,
    ear: 'erectBig', earLen: 0.25, tail: 'stub', tailLen: 0.14, tailR: 0.075, legR: 0.068,
    coats: {
      rotweiss: { name: 'Rot-Weiss', pattern: 'white', base: '#cc7633', mark: '#fbf6ee', dark: '#a85a22', nose: '#1d1715', inner: '#f0c4b0' },
      zobel: { name: 'Zobel-Weiss', pattern: 'sable', base: '#bd7a3c', mark: '#fbf6ee', dark: '#4e3322', nose: '#1d1715', inner: '#efc2ad' },
      tricolor: { name: 'Tricolor', pattern: 'tri', base: '#c27c40', mark: '#fbf6ee', dark: '#1f1b1a', nose: '#111111', inner: '#e8bca8' },
    },
  },
  shiba: {
    name: 'Shiba', leg: 0.5, len: 0.92, r: 0.25, h: 0.26, head: 0.25, muzzleLen: 0.15, muzzleR: 0.1, neck: 0.17,
    ear: 'erect', earLen: 0.17, tail: 'curl', tailLen: 0.46, tailR: 0.075, legR: 0.064,
    coats: {
      rot: { name: 'Rot', pattern: 'urajiro', base: '#c9763a', mark: '#f6e8d2', dark: '#a85c27', nose: '#1d1715', inner: '#f3d9c4' },
      sesam: { name: 'Sesam', pattern: 'sesame', base: '#c27a42', mark: '#f4e5cf', dark: '#3a2a20', nose: '#1d1715', inner: '#efd3bd' },
      schwarzloh: { name: 'Schwarz-Loh', pattern: 'urajiroTan', base: '#231d1a', mark: '#f3e3cc', dark: '#c18750', nose: '#111111', inner: '#ead0bb' },
      creme: { name: 'Creme', pattern: 'urajiro', base: '#ead6b4', mark: '#fbf3e5', dark: '#d7bd94', nose: '#2a1d18', inner: '#f3dccb' },
    },
  },
  mops: {
    name: 'Mops', leg: 0.33, len: 0.76, r: 0.3, h: 0.29, head: 0.28, muzzleLen: 0.07, muzzleR: 0.13, muzzleIn: 0.0, neck: 0.07,
    ear: 'fold', earLen: 0.17, tail: 'curlTight', tailLen: 0.3, tailR: 0.06, legR: 0.07,
    coats: {
      beige: { name: 'Beige', pattern: 'mask', base: '#d9bb8b', mark: '#e6cda2', dark: '#231c19', nose: '#111111', inner: '#3a2c2a' },
      apricot: { name: 'Apricot', pattern: 'mask', base: '#d49b5d', mark: '#e0b07a', dark: '#251c16', nose: '#111111', inner: '#3a2c2a' },
      schwarz: { name: 'Schwarz', pattern: 'solid', base: '#1e1b1a', mark: '#4a423d', dark: '#141212', nose: '#0a0a0a', inner: '#3a2c2a' },
    },
  },
  dalmatiner: {
    name: 'Dalmatiner', leg: 0.72, len: 1.1, r: 0.25, h: 0.29, head: 0.25, muzzleLen: 0.23, muzzleR: 0.1, neck: 0.27,
    ear: 'flop', earLen: 0.19, tail: 'long', tailLen: 0.66, tailR: 0.045, legR: 0.062,
    coats: {
      schwarz: { name: 'Schwarz getupft', pattern: 'spots', base: '#f8f4ee', mark: '#ffffff', dark: '#1e1b1a', nose: '#111111', inner: '#efd6cc' },
      leber: { name: 'Leberbraun getupft', pattern: 'spots', base: '#f8f4ee', mark: '#ffffff', dark: '#6b3a22', nose: '#5a3020', inner: '#efd6cc' },
    },
  },
};

export const BREED_IDS = Object.keys(BREEDS);
export function coatOf(breedId, coatId) {
  const coats = BREEDS[breedId].coats;
  return coats[coatId] ?? Object.values(coats)[0];
}

const COAT_GLSL = /* glsl */ `
uniform vec3 uBase; uniform vec3 uMark; uniform vec3 uDark; uniform vec3 uInner;
uniform int uPattern; uniform int uPart;
uniform vec3 uHeadC; uniform float uHeadR; uniform vec3 uEye;
uniform float uChestZ; uniform float uLen; uniform float uBodyY; uniform float uBodyH; uniform float uLeg; uniform float uSeed;
varying vec3 vRest; varying vec3 vRestN;

float h31(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float spotField(vec3 p, float cell, float rMin, float rMax, float keep){
  vec3 q = p / cell; vec3 i = floor(q); float d = 1e3;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
    vec3 c = i + vec3(float(x), float(y), float(z));
    if (h31(c + 5.3 + uSeed) > keep) continue;
    vec3 pt = c + vec3(h31(c + uSeed), h31(c + 7.1 + uSeed), h31(c + 13.7 + uSeed));
    float r = mix(rMin, rMax, h31(c + 3.3 + uSeed));
    d = min(d, length(q - pt) - r);
  }
  return smoothstep(0.06, -0.06, d);
}
vec3 dogCoat(){
  vec3 p = vRest; vec3 n = normalize(vRestN);
  float fz = (vnoise(p * 26.0) - 0.5) * 0.06;
  float R = uHeadR; vec3 hp = p - uHeadC; vec3 hpa = vec3(abs(hp.x), hp.y, hp.z);
  if (uPart == 6) return uInner;
  float belly = uPart == 0 ? smoothstep(-0.1, -0.55, n.y + fz * 4.0) : 0.0;
  float chest = 0.0;
  if (uPart == 0) chest = smoothstep(uChestZ - 0.3 * uLen, uChestZ - 0.06 * uLen, p.z + fz) * smoothstep(uBodyY + 0.25 * uBodyH, uBodyY - 0.4 * uBodyH, p.y + fz);
  if (uPart == 1) chest = smoothstep(-0.05, 0.4, n.z + fz * 3.0) * smoothstep(0.6, -0.05, n.y + fz * 3.0);
  float muzzle = (uPart == 3 || uPart == 4) ? 1.0 : 0.0;
  float cheek = 0.0, blaze = 0.0, brow = 0.0, crown = 0.0, eyes = 0.0;
  if (uPart == 2) {
    cheek = smoothstep(0.02 * R, -0.32 * R, hp.y + fz) * smoothstep(-0.15 * R, 0.4 * R, hp.z + fz);
    blaze = smoothstep(0.13 * R, 0.07 * R, abs(hp.x) + fz * 0.5 - max(0.0, 0.2 * R - hp.y) * 0.25) * smoothstep(0.1 * R, 0.6 * R, hp.z) * smoothstep(0.85 * R, 0.6 * R, hp.y);
    brow = smoothstep(0.13 * R, 0.08 * R, length(hpa - vec3(uEye.x * 0.85, uEye.y + 0.27 * R, uEye.z - 0.04 * R)) + fz * 0.5);
    crown = smoothstep(0.2 * R, 0.45 * R, hp.y + fz) * smoothstep(0.75 * R, 0.2 * R, hp.z);
    eyes = smoothstep(0.27 * R, 0.19 * R, length(hpa - uEye) + fz);
  }
  float legLow = (uPart == 7) ? smoothstep(uLeg * 0.55, uLeg * 0.3, p.y + fz) : (uPart == 8 ? 1.0 : 0.0);
  float tailUnder = uPart == 9 ? smoothstep(0.15, -0.45, n.y + fz * 3.0) : 0.0;
  float saddle = 0.0;
  if (uPart == 0) saddle = smoothstep(0.0, 0.45, n.y + fz * 3.0) * smoothstep(uChestZ - 0.05 * uLen, uChestZ - 0.3 * uLen, p.z + fz);
  if (uPart == 1) saddle = smoothstep(0.15, 0.6, n.y - n.z * 0.4 + fz * 3.0);
  if (uPart == 2) saddle = crown;
  if (uPart == 9) saddle = smoothstep(-0.1, 0.4, n.y + fz * 3.0);
  if (uPart == 5) saddle = 1.0;

  vec3 c = uBase;
  if (uPattern == 0) {
    c = mix(uBase, uMark, clamp(belly * 0.7 + chest * 0.5 + muzzle * 0.45 + legLow * 0.2, 0.0, 1.0));
  } else if (uPattern == 1) {
    float t = clamp(brow + muzzle * 0.85 + cheek * 0.5 + chest * 0.85 + legLow + tailUnder * 0.8, 0.0, 1.0);
    c = mix(uBase, uMark, t);
  } else if (uPattern == 2 || uPattern == 3 || uPattern == 4) {
    if (uPattern == 3) c = mix(uBase, uDark, saddle * (uPart == 2 ? 0.9 : 1.0));
    if (uPattern == 4) c = mix(uBase, uDark, saddle * 0.5);
    float w = clamp(muzzle + blaze + chest + belly + legLow + cheek * 0.35 + (uPart == 1 ? chest : 0.0), 0.0, 1.0);
    c = mix(c, uMark, w);
  } else if (uPattern == 5 || uPattern == 6 || uPattern == 7) {
    if (uPattern == 6) c = mix(uBase, uDark, clamp(brow + legLow * 0.9 + muzzle * 0.6 + chest * 0.4, 0.0, 1.0));
    if (uPattern == 7) c = mix(uBase, uDark, saddle * (0.25 + 0.55 * vnoise(p * 55.0)));
    float w = clamp(cheek * 0.95 + muzzle * (uPart == 4 ? 1.0 : 0.75) + chest + belly + legLow * (uPattern == 6 ? 0.0 : 0.55) + tailUnder + brow * (uPattern == 6 ? 0.0 : 0.6), 0.0, 1.0);
    c = mix(c, uMark, w);
  } else if (uPattern == 8) {
    float m = clamp(muzzle + eyes * 0.6 + (uPart == 5 ? 1.0 : 0.0), 0.0, 1.0);
    c = mix(mix(uBase, uMark, belly * 0.5 + chest * 0.4), uDark, m);
  } else if (uPattern == 9) {
    float s = uPart == 5 ? spotField(p, 0.07, 0.35, 0.6, 0.8) : spotField(p, 0.11, 0.2, 0.36, uPart == 3 || uPart == 4 ? 0.3 : 0.62);
    if (uPart == 8) s *= 0.4;
    c = mix(uBase, uDark, s);
  }
  return c * (0.92 + 0.16 * vnoise(p * 48.0));
}
`;

function coatMaterial(shared, part, dark) {
  const m = new THREE.MeshPhysicalMaterial({
    roughness: 0.82, sheen: 1, sheenRoughness: 0.45,
    sheenColor: new THREE.Color(dark ? '#c9c2d6' : '#fff1e0').multiplyScalar(dark ? 0.6 : 0.35),
  });
  const uniforms = { ...shared, uPart: { value: PART[part] } };
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 rest; attribute vec3 restN; varying vec3 vRest; varying vec3 vRestN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRest = rest; vRestN = restN;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + COAT_GLSL)
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( dogCoat(), opacity );');
  };
  m.customProgramCacheKey = () => 'dogcoat';
  return m;
}

const SPHERE = new THREE.SphereGeometry(1, 40, 28);

export function createDog(breedId, coatId, { seed = 1 } = {}) {
  const B = BREEDS[breedId];
  const C = coatOf(breedId, coatId);
  const shared = {
    uBase: { value: new THREE.Color(C.base) }, uMark: { value: new THREE.Color(C.mark) },
    uDark: { value: new THREE.Color(C.dark) }, uInner: { value: new THREE.Color(C.inner) },
    uPattern: { value: PATTERN[C.pattern] }, uHeadC: { value: new THREE.Vector3() }, uHeadR: { value: B.head },
    uEye: { value: new THREE.Vector3() }, uChestZ: { value: 0 }, uLen: { value: B.len }, uBodyY: { value: 0 },
    uBodyH: { value: B.h }, uLeg: { value: B.leg }, uSeed: { value: seed * 0.37 },
  };
  const mats = {};
  const isDark = shared.uBase.value.getHSL({}).l < 0.12;
  for (const p of Object.keys(PART)) mats[p] = coatMaterial(shared, p, isDark);
  const coatMeshes = [];

  const add = (parent, geo, part, pos = [0, 0, 0], scale = [1, 1, 1], rot = [0, 0, 0]) => {
    const mesh = new THREE.Mesh(geo, typeof part === 'string' ? mats[part] : part);
    mesh.position.set(...pos);
    mesh.scale.set(...scale);
    mesh.rotation.set(...rot);
    mesh.castShadow = true;
    parent.add(mesh);
    if (typeof part === 'string') coatMeshes.push(mesh);
    return mesh;
  };
  const group = (parent, pos = [0, 0, 0]) => {
    const g = new THREE.Group();
    g.position.set(...pos);
    parent.add(g);
    return g;
  };

  const L = B.len, R = B.r, H = B.h, LEG = B.leg, HR = B.head;
  const zF = L * 0.7; // shoulder joint, torso local (rear hip joint is the origin)
  const root = new THREE.Group();
  const torso = group(root, [0, LEG, -zF / 2]);

  // body: main ellipsoid + deep chest + rump
  add(torso, SPHERE, 'body', [0, H * 0.35, zF * 0.5], [R, H, L * 0.5]);
  add(torso, SPHERE, 'body', [0, H * 0.18, zF * 0.86], [R * 1.02, H * 1.02, R * 1.05]);
  add(torso, SPHERE, 'body', [0, H * 0.4, zF * 0.06], [R * 0.95, H * 0.92, R * 1.05]);

  // collar + tag
  const collarMat = new THREE.MeshStandardMaterial({ color: COLLAR, roughness: 0.55 });
  const tagMat = new THREE.MeshStandardMaterial({ color: '#ffd23f', roughness: 0.3, metalness: 0.4 });

  // neck and head
  const neckPitch = 0.75;
  const neckBase = group(torso, [0, H * 0.55, zF * 0.95]);
  neckBase.rotation.x = neckPitch;
  const neckLen = Math.max(B.neck, 0.04);
  const neckR = HR * 0.62;
  add(neckBase, new THREE.CapsuleGeometry(neckR, neckLen, 8, 24), 'neck', [0, neckLen * 0.5, 0]);
  const collar = add(neckBase, new THREE.TorusGeometry(neckR * 1.02, neckR * 0.16, 12, 40), collarMat, [0, neckLen * 0.2, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  const tag = add(collar, new THREE.CylinderGeometry(neckR * 0.22, neckR * 0.22, neckR * 0.06, 20), tagMat);
  tag.rotation.set(Math.PI / 2, 0, 0);
  tag.position.set(0, neckR * 1.25, -neckR * 0.15);

  const headAnchor = group(neckBase, [0, neckLen + neckR * 0.2, 0]);
  const head = group(headAnchor, [0, HR * 0.25, HR * 0.15]);
  head.rotation.order = 'YXZ';
  headAnchor.rotation.x = -neckPitch;
  add(head, SPHERE, 'head', [0, 0, 0], [HR * 0.95, HR * 0.9, HR]);
  const mz = B.muzzleLen, mr = B.muzzleR;
  const muzzleZ = HR * (0.68 - (B.muzzleIn ?? 0)) + mz * 0.5;
  const muzzleY = -HR * 0.3;
  add(head, SPHERE, 'muzzle', [0, muzzleY, muzzleZ], [mr * 1.08, mr * 0.82, mz * 0.5 + mr * 0.45]);
  const tipZ = muzzleZ + mz * 0.5 + mr * 0.42;
  const darkGloss = (hex) => new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 });
  add(head, SPHERE, darkGloss(C.nose), [0, muzzleY + mr * 0.42, tipZ - mr * 0.12], [mr * 0.5, mr * 0.34, mr * 0.32]);
  const jaw = group(head, [0, muzzleY - mr * 0.35, HR * 0.55]);
  add(jaw, SPHERE, 'jaw', [0, -mr * 0.2, mz * 0.45 + mr * 0.15], [mr * 0.82, mr * 0.38, mz * 0.45 + mr * 0.35]);
  const tongueMat = new THREE.MeshStandardMaterial({ color: '#e8707a', roughness: 0.5 });
  const tongue = add(jaw, SPHERE, tongueMat, [0, mr * 0.05, mz * 0.45 + mr * 0.2], [mr * 0.5, mr * 0.12, mz * 0.4 + mr * 0.3]);
  const mouthMat = new THREE.MeshStandardMaterial({ color: '#4a1f22', roughness: 0.9 });
  add(head, SPHERE, mouthMat, [0, muzzleY - mr * 0.4, muzzleZ - mz * 0.1 - mr * 0.1], [mr * 0.6, mr * 0.12, mz * 0.4 + mr * 0.25]);

  // eyes with highlight; lids are the eye group's y scale
  const eyeMat = darkGloss('#2b1a12');
  const shineMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const eyePos = new THREE.Vector3(HR * 0.4, HR * 0.08, HR * 0.8);
  const eyes = [-1, 1].map((s) => {
    const g = group(head, [s * eyePos.x, eyePos.y, eyePos.z]);
    add(g, SPHERE, eyeMat, [0, 0, 0], [HR * 0.15, HR * 0.155, HR * 0.12]);
    add(g, SPHERE, shineMat, [-HR * 0.04, HR * 0.06, HR * 0.1], [HR * 0.045, HR * 0.045, HR * 0.03]).castShadow = false;
    add(g, SPHERE, shineMat, [HR * 0.05, -HR * 0.05, HR * 0.105], [HR * 0.02, HR * 0.02, HR * 0.015]).castShadow = false;
    return g;
  });

  // ears
  const ears = [-1, 1].map((s) => {
    const pivot = group(head, [s * HR * 0.58, HR * 0.6, -HR * 0.02]);
    const el = B.earLen;
    if (B.ear === 'flop' || B.ear === 'longflop') {
      const w = B.ear === 'longflop' ? 0.5 : 0.4;
      pivot.position.set(s * HR * 0.72, HR * 0.42, HR * 0.08);
      add(pivot, SPHERE, 'ear', [s * 0.035, -el * 0.58, 0.0], [0.05, el * 0.66, el * w], [0, 0, s * 0.06]);
      pivot.userData.base = { z: s * 0.12, x: 0.12 };
    } else if (B.ear === 'erect' || B.ear === 'erectBig') {
      const cone = new THREE.ConeGeometry(el * (B.ear === 'erectBig' ? 0.55 : 0.5), el, 28);
      add(pivot, cone, 'ear', [0, el * 0.5, 0], [1, 1, 0.38]);
      add(pivot, cone, 'earInner', [0, el * 0.44, el * 0.06], [0.72, 0.82, 0.25]);
      pivot.userData.base = { z: -s * 0.32, x: -0.12 };
    } else {
      pivot.position.set(s * HR * 0.72, HR * 0.5, HR * 0.1);
      add(pivot, SPHERE, 'ear', [s * el * 0.3, -el * 0.25, el * 0.15], [el * 0.45, 0.03, el * 0.42], [0.4, 0, s * 1.1]);
      pivot.userData.base = { z: 0, x: 0 };
    }
    pivot.rotation.z = pivot.userData.base.z;
    pivot.rotation.x = pivot.userData.base.x;
    return pivot;
  });

  // legs: pivot -> upper -> knee -> ankle -> paw
  const legs = [];
  for (const front of [true, false]) {
    for (const s of [-1, 1]) {
      const pivot = group(torso, [s * R * 0.55, 0, front ? zF : 0]);
      const pr = B.legR * 1.25;
      const reach = LEG - pr * 0.55;
      const L1 = reach * 0.51, L2 = reach * 0.51;
      const upper = group(pivot);
      const ur = B.legR * (front ? 1.2 : 1.35);
      add(upper, new THREE.CapsuleGeometry(ur, L1, 6, 16), 'leg', [0, -L1 / 2, 0]);
      if (!front) add(upper, SPHERE, 'leg', [0, -L1 * 0.25, -ur * 0.2], [ur * 1.55, L1 * 0.55, ur * 1.9]);
      else add(upper, SPHERE, 'leg', [0, -L1 * 0.1, 0], [ur * 1.35, L1 * 0.45, ur * 1.5]);
      const knee = group(upper, [0, -L1, 0]);
      add(knee, new THREE.CapsuleGeometry(B.legR, L2, 6, 16), 'leg', [0, -L2 / 2, 0]);
      const ankle = group(knee, [0, -L2, 0]);
      add(ankle, SPHERE, 'paw', [0, 0, pr * 0.35], [pr * 1.05, pr * 0.62, pr * 1.3]);
      legs.push({ front, s, pivot, upper, knee, ankle, L1, L2, pr });
    }
  }

  // tail chain
  const tailBase = group(torso, [0, H * 0.62, -L * 0.16]);
  const TAIL = {
    otter: { n: 9, up: 0.25, curl: 0.04, taper: 0.45, fluff: 1.0 },
    thin: { n: 10, up: 0.45, curl: 0.06, taper: 0.4, fluff: 1.0 },
    stub: { n: 3, up: 0.6, curl: 0.1, taper: 0.75, fluff: 1.2 },
    curl: { n: 12, up: 1.25, curl: 0.42, taper: 0.55, fluff: 1.15 },
    curlTight: { n: 10, up: 1.45, curl: 0.58, taper: 0.6, fluff: 1.0 },
    long: { n: 12, up: 0.3, curl: 0.06, taper: 0.3, fluff: 1.0 },
  }[B.tail];
  const tailSegs = [];
  let parent = tailBase;
  const segLen = B.tailLen / TAIL.n;
  for (let i = 0; i < TAIL.n; i++) {
    const g = group(parent, i === 0 ? [0, 0, 0] : [0, 0, -segLen]);
    const k = i / (TAIL.n - 1 || 1);
    const r = B.tailR * TAIL.fluff * (1 - k * (1 - TAIL.taper));
    add(g, SPHERE, 'tail', [0, 0, -segLen * 0.5], [r, r, Math.max(r, segLen * 0.75)]);
    tailSegs.push(g);
    parent = g;
  }

  // bake rest-space position/normal for the coat shader (standing, legs straight)
  tailSegs[0].rotation.x = TAIL.up;
  for (let i = 1; i < tailSegs.length; i++) tailSegs[i].rotation.x = TAIL.curl;
  root.updateMatrixWorld(true);
  const nm = new THREE.Matrix3();
  for (const mesh of coatMeshes) {
    mesh.geometry = mesh.geometry.clone();
    const pos = mesh.geometry.attributes.position;
    const nor = mesh.geometry.attributes.normal;
    const rest = new Float32Array(pos.count * 3);
    const restN = new Float32Array(pos.count * 3);
    nm.getNormalMatrix(mesh.matrixWorld);
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
      rest.set([v.x, v.y, v.z], i * 3);
      v.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize();
      restN.set([v.x, v.y, v.z], i * 3);
    }
    mesh.geometry.setAttribute('rest', new THREE.BufferAttribute(rest, 3));
    mesh.geometry.setAttribute('restN', new THREE.BufferAttribute(restN, 3));
  }
  const hc = new THREE.Vector3();
  head.getWorldPosition(hc);
  shared.uHeadC.value.copy(hc);
  shared.uEye.value.copy(eyePos);
  shared.uChestZ.value = -zF / 2 + zF * 0.86 + R * 1.05;
  shared.uBodyY.value = LEG + H * 0.35;

  // ---- pose ----
  const rotX = (y, z, a) => [y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
  function ik(leg, ty, tz, torsoA) {
    const { L1, L2 } = leg;
    let d = Math.hypot(ty, tz);
    d = Math.min(Math.max(d, Math.abs(L1 - L2) + 1e-3), (L1 + L2) * 0.999);
    const a = Math.atan2(-tz, -ty);
    const alpha = Math.acos(Math.min(1, Math.max(-1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
    const beta = Math.acos(Math.min(1, Math.max(-1, (L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2))));
    if (leg.front) { leg.upper.rotation.x = a + alpha; leg.knee.rotation.x = -(Math.PI - beta); }
    else { leg.upper.rotation.x = a - alpha; leg.knee.rotation.x = Math.PI - beta; }
    leg.ankle.rotation.x = -(torsoA + leg.upper.rotation.x + leg.knee.rotation.x);
  }

  const sitShoulder = LEG * 1.02;
  const sitHip = H * 0.42 + 0.03;
  const sitTheta = Math.asin(Math.min(0.9, (sitShoulder - sitHip) / zF));

  // state: { sit, gait: {phase, stride, lift} | null, bob, jump, lean, headYaw, headPitch, headTilt, wag, tailUp,
  //          mouth, blink, earPerk, earFlap, tongue, paw, pawSide }
  function pose(st = {}) {
    const sit = st.sit ?? 0;
    const theta = sitTheta * sit + (st.lean ?? 0);
    const hipY = LEG + (sitHip - LEG) * sit + (st.bob ?? 0) + (st.jump ?? 0);
    torso.position.set(0, hipY, -zF / 2);
    torso.rotation.x = -theta;
    const a = -theta;
    for (const leg of legs) {
      const [py, pz] = rotX(leg.pivot.position.y, leg.pivot.position.z, a);
      const wy = hipY + py, wz = -zF / 2 + pz;
      let fy = leg.pr * 0.55, fz;
      if (leg.front) fz = wz + 0.02;
      else fz = -zF / 2 + B.legR * 3.2 * sit;
      if (st.gait) {
        const g = st.gait;
        const ph = g.phase * Math.PI * 2 + (leg.front === (leg.s > 0) ? 0 : Math.PI) + (leg.front ? 0 : 0.35);
        fz += Math.cos(ph) * g.stride * LEG;
        fy += Math.max(0, Math.sin(ph)) * g.lift * LEG;
      }
      if (st.jump) fy = Math.max(fy, wy - (leg.L1 + leg.L2) * 0.92);
      if (st.paw && leg.front && leg.s === (st.pawSide ?? 1)) {
        fy = wy - (leg.L1 + leg.L2) * 0.55 + st.paw * LEG * 0.25;
        fz = wz + (leg.L1 + leg.L2) * 0.75 * st.paw;
      }
      const [ly, lz] = rotX(fy - wy, fz - wz, -a);
      ik(leg, ly, lz, a);
    }
    head.rotation.set((st.headPitch ?? 0) + theta * 0.8, st.headYaw ?? 0, st.headTilt ?? 0);
    const perk = st.earPerk ?? 0;
    ears.forEach((e, i) => {
      const s = i === 0 ? -1 : 1;
      const b = e.userData.base;
      const flop = B.ear === 'flop' || B.ear === 'longflop';
      e.rotation.z = b.z + (flop ? s * 0.25 * perk : -s * 0.1 * perk) + (st.earFlap ?? 0) * s;
      e.rotation.x = b.x + (flop ? -0.35 * perk : -0.15 * perk);
    });
    const blink = st.blink ?? 0;
    eyes.forEach((e) => e.scale.set(1, Math.max(0.08, 1 - blink), 1));
    jaw.rotation.x = 0.55 * (st.mouth ?? 0);
    tongue.position.z = (B.muzzleLen * 0.45 + B.muzzleR * 0.2) + (st.tongue ?? 0) * B.muzzleR * 0.8;
    tongue.rotation.x = (st.tongue ?? 0) * 0.5;
    tailSegs[0].rotation.y = st.wag ?? 0;
    tailSegs[0].rotation.x = TAIL.up + (st.tailUp ?? 0);
    for (let i = 1; i < tailSegs.length; i++) tailSegs[i].rotation.y = (st.wag ?? 0) * 0.15;
  }
  pose({});

  return {
    group: root, breed: B, coat: C, pose, head, jaw, mats, shared,
    mouthPoint: () => head.localToWorld(new THREE.Vector3(0, muzzleY - mr * 0.25, tipZ - mr * 0.2)),
    headTop: () => head.localToWorld(new THREE.Vector3(0, HR * 1.1, 0)),
    height: LEG + H * 1.3 + HR * 2,
  };
}

// Idle behaviour as a pure function of time (blink, ear twitch, breathing, wag, head turns).
export function idleState(t, seed, { sit = 1, wagSpeed = 7, wagAmp = 0.35, look = 0.35 } = {}) {
  const h = (k) => { const x = Math.sin(seed * 91.7 + k * 12.9898) * 43758.5453; return x - Math.floor(x); };
  const blinkPeriod = 3 + h(1) * 2.5;
  const bt = (t + h(2) * blinkPeriod) % blinkPeriod;
  const blink = bt < 0.14 ? Math.sin((bt / 0.14) * Math.PI) : 0;
  const tt = t + h(3) * 3;
  const slot = Math.floor(tt / 2.6);
  const local = (tt % 2.6) / 2.6;
  const val = (s) => Math.sin(s * 7.31 + seed * 3.1) * 0.5 + 0.5;
  const e = Math.min(1, local * 4);
  const k = e * e * (3 - 2 * e);
  const yaw = (val(slot - 1) + (val(slot) - val(slot - 1)) * k - 0.5) * 2 * look;
  const lt = Math.sin(slot * 3.17 + seed) * 0.5 + 0.5;
  const tilt = (lt > 0.7 ? 1 : 0) * Math.sin(Math.min(1, local * 2) * Math.PI) * 0.35 * (val(slot) > 0.5 ? 1 : -1);
  const twitchT = (t + h(4) * 4) % 4.2;
  const earFlap = twitchT < 0.25 ? Math.sin((twitchT / 0.25) * Math.PI * 2) * 0.12 : 0;
  return {
    sit, blink, headYaw: yaw, headTilt: tilt, headPitch: 0.05 * Math.sin(t * 0.7 + seed),
    wag: Math.sin(t * wagSpeed + seed) * wagAmp, bob: Math.sin(t * 2.2 + seed) * 0.006, earFlap,
    tongue: 0, mouth: 0,
  };
}