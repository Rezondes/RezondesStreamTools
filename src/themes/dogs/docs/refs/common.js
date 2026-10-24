/* eslint-disable -- reference prototype outside the build (THEMES.md, docs/refs), not held to the code rules */
// Shared helpers for the Dogs prototypes: query params, deterministic time, stage scaling, easing.
export const Q = new URLSearchParams(location.search);
export const FIXED_T = Q.has('t') ? parseFloat(Q.get('t')) : null;

export function clock() {
  const t0 = performance.now();
  return () => (FIXED_T ?? (performance.now() - t0) / 1000);
}

export function fitStage(el) {
  const fit = () => {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    el.style.transform = `translate(-50%, -50%) scale(${s})`;
  };
  fit();
  addEventListener('resize', fit);
}

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const lerp = (a, b, k) => a + (b - a) * k;
export const smooth = (k) => k * k * (3 - 2 * k);
export const easeOut = (k) => 1 - Math.pow(1 - k, 3);
export const easeIn = (k) => k * k * k;
export const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const backOut = (k, s = 1.70158) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);
export function elasticOut(k) {
  if (k === 0 || k === 1) return k;
  return Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
}

// deterministic hash 0..1
export function hash(...n) {
  let h = 2166136261;
  for (const v of n) {
    h ^= Math.floor(v * 1000) + 0x9e3779b9;
    h = Math.imul(h, 16777619);
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995);
    h ^= h >>> 15;
  }
  return (h >>> 0) / 4294967296;
}