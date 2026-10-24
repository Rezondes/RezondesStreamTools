/* eslint-disable -- reference prototype outside the build (THEMES.md, docs/refs), not held to the code rules */
// Pixel-art dogs: each breed is built from pixel primitives (ellipse, polygon, rect), then gets an automatic outline
// and light/shadow rims; legs are drawn per frame from hip to foot. Coat colours come from a palette per coat
// variant, with placeholder keys for markings (W mark, S saddle, T tan points, M mask, X spots/dark, d darker coat).
// Everything is a pure function of time.
import { BREEDS as LOOK, COLLAR, coatOf } from './dog.js';
export { COLLAR, coatOf };

// ---------- colour helpers ----------
const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const hex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
// memoized: draw() shades every pixel of every frame with the same few colours
const shaded = new Map();
export const shade = (h, k) => {
  const key = h + k;
  let s = shaded.get(key);
  if (!s) { const c = rgb(h); s = hex(c.map((v) => (k > 0 ? v + (255 - v) * k : v * (1 + k)))); shaded.set(key, s); }
  return s;
};
export const mix = (a, b, k) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * k)); };

// ---------- pixel grid ----------
class Grid {
  constructor(w, h) { this.w = w; this.h = h; this.k = Array(w * h).fill('.'); this.m = new Int8Array(w * h); }
  get(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? '.' : this.k[y * this.w + x]; }
  set(x, y, key, mod = 0) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.k[y * this.w + x] = key; this.m[y * this.w + x] = mod; }
  fill(test, key, only) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (!test(x + 0.5, y + 0.5)) continue;
      if (only && !only.includes(this.get(x, y))) continue;
      this.set(x, y, key);
    }
    return this;
  }
  ell(cx, cy, rx, ry, key, only) { return this.fill((x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1, key, only); }
  rect(x0, y0, x1, y1, key, only) { return this.fill((x, y) => x >= x0 && x <= x1 + 1 && y >= y0 && y <= y1 + 1, key, only); }
  poly(pts, key, only) {
    return this.fill((x, y) => {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    }, key, only);
  }
  line(x0, y0, x1, y1, key, width = 1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / n), y = Math.round(y0 + ((y1 - y0) * i) / n);
      for (let w = 0; w < width; w++) this.set(x + w, y, key);
    }
    return this;
  }
  // outline around everything, then light rims on top/right and shadow rims at bottom/left
  finish(coatKeys = 'OWSTMXd') {
    const filled = (x, y) => { const c = this.get(x, y); return c !== '.' && c !== 'o'; };
    const out = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y) !== '.') continue;
      if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) out.push([x, y]);
    }
    for (const [x, y] of out) this.set(x, y, 'o');
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const c = this.get(x, y);
      if (!coatKeys.includes(c)) continue;
      const edge = (dx, dy) => { const n = this.get(x + dx, y + dy); return n === 'o' || n === '.'; };
      let m = 0;
      if (edge(0, -1) || edge(1, 0)) m = 1;
      if (edge(0, 1) || edge(-1, 0)) m = -1;
      if (edge(0, 2) && !edge(0, -1)) m = -1;
      this.m[y * this.w + x] = m;
    }
    return this;
  }
}

// ---------- breeds (side view, facing right; foot row = h - 2, ground outline = h - 1) ----------
const BUILD = {
  corgi() {
    const g = new Grid(52, 34);
    g.ell(10, 19, 5, 6, 'O').ell(22, 20, 15, 7, 'O').ell(34, 21, 6, 6, 'W');
    g.rect(14, 25, 32, 27, 'W', 'O');
    g.poly([[13, 13.5], [33, 13.5], [33, 16], [13, 17]], 'S', 'O');
    g.poly([[28, 15], [33, 8], [40, 10], [38, 20], [31, 21]], 'O');
    g.poly([[36, 12], [40, 11], [41, 17], [38, 23], [34, 21]], 'W', 'O');
    g.poly([[32, 8], [34, 0], [37, 7]], 'O').poly([[36, 7], [39, 0], [42, 7]], 'O');
    g.ell(38, 11, 6, 5, 'O');
    g.poly([[32.5, 7.5], [34, 2], [35.5, 7]], 'S', 'O');
    g.poly([[37.5, 7], [39, 2.5], [40.6, 7]], 'P');
    g.rect(40, 5, 41, 9, 'W', 'O');
    g.poly([[41, 10], [48, 11], [48, 14], [43, 16], [40, 14]], 'W');
    g.ell(37, 6, 4, 1.6, 'S', 'O');
    g.rect(47, 11, 48, 12, 'N');
    g.line(31, 11, 34, 19, 'R', 2);
    return { g, legTop: 26, legs: { up: 'O', low: 'W', hips: [12, 15, 31, 34] }, eye: [39, 9], mouth: [43, 16], tag: [35, 21],
      tail: { pts: [[10, 15], [6, 12], [3, 6], [4, 2], [7, 3], [9, 8], [13, 13]], key: 'O', tip: 'W', base: [11, 15] } };
  },
  shiba() {
    const g = new Grid(50, 39);
    g.ell(11, 19, 5, 6, 'O').ell(22, 20, 13, 6, 'O').ell(32, 21, 5, 6, 'W');
    g.rect(15, 24, 30, 26, 'W', 'O');
    g.poly([[27, 16], [31, 8], [38, 9], [37, 20], [30, 21]], 'O');
    g.poly([[35, 12], [39, 12], [39, 18], [36, 22], [33, 20]], 'W', 'O');
    g.poly([[32, 7], [34, 1], [36, 7]], 'O').poly([[36, 6], [38, 0], [41, 6]], 'O');
    g.ell(37, 10, 6, 5, 'O');
    g.poly([[37, 6], [38, 2], [40, 6]], 'P');
    g.ell(40, 13, 4, 2.6, 'W', 'O');
    g.poly([[41, 10], [47, 11], [47, 14], [42, 16], [40, 14]], 'W');
    g.set(38, 7, 'W');
    g.rect(46, 11, 47, 12, 'N');
    g.line(30, 11, 33, 19, 'R', 2);
    return { g, legTop: 25, legs: { up: 'O', low: 'W', hips: [13, 16, 30, 33] }, eye: [39, 9], mouth: [42, 16], tag: [34, 21],
      tail: { ring: [12, 10, 4.5, 4.2, 1.8], key: 'O', tip: 'W', base: [11, 15] } };
  },
  labrador() {
    const g = new Grid(60, 46);
    g.ell(12, 23, 6, 7, 'O').ell(26, 24, 16, 8, 'O').ell(38, 25, 7, 8, 'O');
    g.ell(41, 27, 4, 5, 'W', 'O');
    g.poly([[32, 20], [37, 10], [46, 12], [44, 25], [35, 26]], 'O');
    g.ell(45, 12, 7, 6, 'O');
    g.poly([[49, 11], [57, 13], [57, 17], [50, 19], [47, 16]], 'O');
    g.poly([[39, 7], [44, 7], [46, 15], [42, 18], [39, 13]], 'd');
    g.rect(56, 13, 57, 14, 'N');
    g.line(36, 14, 39, 24, 'R', 2);
    return { g, legTop: 31, legs: { up: 'O', low: 'O', hips: [15, 18, 37, 40] }, eye: [48, 10], mouth: [52, 19], tag: [40, 25],
      tail: { pts: [[12, 18], [2, 19], [1, 21], [11, 23]], key: 'O', base: [12, 20] } };
  },
  dalmatiner() {
    const g = new Grid(60, 50);
    g.ell(13, 23, 5, 6, 'O').ell(26, 24, 15, 7, 'O').ell(37, 25, 6, 7, 'O');
    g.poly([[32, 20], [37, 8], [45, 9], [44, 24], [35, 26]], 'O');
    g.ell(44, 10, 6, 5, 'O');
    g.poly([[48, 9], [56, 11], [56, 14], [49, 16], [46, 13]], 'O');
    g.poly([[39, 6], [44, 6], [45, 13], [41, 15], [39, 11]], 'X');
    g.rect(55, 11, 56, 12, 'N');
    g.line(35, 12, 38, 23, 'R', 2);
    return { g, legTop: 30, legs: { up: 'O', low: 'O', hips: [15, 18, 36, 39] }, eye: [47, 8], mouth: [51, 16], tag: [39, 24], spots: true,
      tail: { pts: [[12, 19], [1, 23], [1, 24], [12, 21]], key: 'O', base: [12, 20] } };
  },
  dackel() {
    const g = new Grid(64, 30);
    g.ell(12, 16, 5, 6, 'O').ell(30, 17, 20, 6, 'O').ell(46, 18, 6, 7, 'O');
    g.ell(47, 21, 4, 4, 'T', 'O');
    g.poly([[42, 13], [47, 6], [53, 8], [51, 19], [44, 20]], 'O');
    g.ell(51, 8, 5, 4, 'O');
    g.poly([[54, 7], [63, 9], [63, 11], [56, 13], [53, 11]], 'T');
    g.poly([[46, 6], [51, 6], [52, 14], [48, 16], [46, 11]], 'd');
    g.set(53, 5, 'T');
    g.rect(62, 8, 63, 9, 'N');
    g.line(44, 10, 46, 18, 'R', 2);
    return { g, legTop: 22, legs: { up: 'O', low: 'T', hips: [15, 18, 44, 47] }, eye: [53, 6], mouth: [57, 13], tag: [47, 19],
      tail: { pts: [[10, 13], [2, 17], [1, 18], [10, 16]], key: 'O', base: [10, 15] } };
  },
  mops() {
    const g = new Grid(44, 36);
    g.ell(9, 19, 5, 6, 'O').ell(18, 20, 11, 7, 'O').ell(27, 21, 5, 7, 'O');
    g.poly([[22, 15], [26, 9], [33, 10], [33, 22], [25, 23]], 'O');
    g.ell(30, 11, 7, 6, 'O');
    g.ell(36, 12.5, 4, 3.8, 'M');
    g.ell(32.5, 9, 2.6, 2.4, 'M', 'O');
    g.poly([[25, 6], [29, 5], [29, 9], [26, 9]], 'M');
    g.set(30, 6, 'd'); g.set(31, 6, 'd'); g.set(32, 7, 'd');
    g.rect(38, 11, 39, 12, 'N');
    g.line(24, 13, 26, 22, 'R', 2);
    return { g, legTop: 26, legs: { up: 'O', low: 'O', hips: [11, 14, 26, 28] }, eye: [32, 8], mouth: [36, 16], tag: [27, 22],
      tail: { ring: [9, 12, 3.3, 3.2, 1.2], key: 'O', base: [9, 15] } };
  },
};
export const BREED_IDS = Object.keys(BUILD);
export const BREEDS = Object.fromEntries(BREED_IDS.map((id) => [id, LOOK[id]]));

function palette(coat) {
  const { base, mark, dark, nose, pattern } = coat;
  return {
    o: '#2e1d14', O: base, d: shade(base, -0.24), W: mark,
    S: pattern === 'tri' ? dark : pattern === 'sable' ? mix(base, dark, 0.45) : pattern === 'sesame' ? mix(base, dark, 0.3) : base,
    T: pattern === 'tan' ? mark : pattern === 'urajiroTan' ? dark : base,
    M: pattern === 'mask' ? dark : shade(base, -0.15),
    X: pattern === 'spots' ? dark : shade(base, -0.24),
    N: nose, k: '#1d1412', E: '#ffffff', P: '#e98a95', R: COLLAR, Y: '#ffd23f',
  };
}

// ---------- the dog ----------
export function makeDog(breedId, coatId) {
  const def = BUILD[breedId]();
  const coat = coatOf(breedId, coatId);
  const pal = palette(coat);
  const g = def.g;
  if (def.spots) {
    for (let cy = 0; cy < g.h; cy += 3) for (let cx = 0; cx < g.w; cx += 3) {
      const h = Math.abs(Math.sin(cx * 12.99 + cy * 78.23) * 43758.55) % 1;
      if (h > 0.42) continue;
      const ox = cx + Math.floor(h * 7) % 2, oy = cy + Math.floor(h * 13) % 2;
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) if (g.get(ox + dx, oy + dy) === 'O') g.set(ox + dx, oy + dy, 'X');
    }
  }
  g.set(def.tag[0], def.tag[1], 'Y');
  g.finish();
  const H = g.h, foot = H - 2;
  // tail as its own layer, bent by the wag (top bends most)
  function tailLayer(wag) {
    const t = new Grid(g.w, g.h), T = def.tail;
    if (T.ring) {
      const [cx, cy, rx, ry, hole] = T.ring;
      const ccx = cx + wag * 0.8;
      t.ell(ccx, cy, rx, ry, T.key).ell(ccx, cy, hole, hole, '.');
      t.ell(ccx + 0.5, cy + ry * 0.55, rx * 0.55, ry * 0.4, T.tip ?? T.key, [T.key]);
      t.poly([[T.base[0] - 1, T.base[1] + 1], [ccx - 1, cy + ry - 1], [ccx + 2, cy + ry - 1], [T.base[0] + 2, T.base[1] + 1]], T.key);
    } else {
      const [bx, by] = T.base;
      const bent = T.pts.map(([x, y]) => [x + wag * 1.6 * Math.min(1, Math.hypot(x - bx, y - by) / 10) * (by - y >= 0 ? 1 : -0.4), y]);
      t.poly(bent, T.key);
      if (T.tip) t.ell(bent[3][0], bent[3][1] + 1, 2, 2, T.tip, [T.key]);
    }
    return t.finish();
  }
  const tails = [-1, -0.5, 0, 0.5, 1].map(tailLayer);
  // legs: hip to foot, coat on top, lower colour below, wider paw, own outline; far legs darker
  function leg(grid, hx, dx, lift, far) {
    const top = def.legTop, f = foot - lift, mod = far ? -2 : 0;
    for (let y = top; y <= f; y++) {
      const k = (y - top) / Math.max(1, f - top);
      const cx = Math.round(hx + dx * k);
      const key = y - top < Math.max(2, (f - top) * 0.35) ? def.legs.up : def.legs.low;
      if (y === f) {
        for (let x = cx - 2; x <= cx + 3; x++) grid.set(x, y, x === cx - 2 || x === cx + 3 ? 'o' : def.legs.low, mod);
        for (let x = cx - 1; x <= cx + 2; x++) grid.set(x, y + 1, 'o');
      } else {
        grid.set(cx - 2, y, 'o'); grid.set(cx + 2, y, 'o');
        for (let x = cx - 1; x <= cx + 1; x++) grid.set(x, y, key, x === cx + 1 ? mod + 1 : mod);
      }
    }
  }
  const CYCLE = [[2, 0], [1, 0], [0, 0], [-1, 0], [-2, 0], [0, 2]];
  const [nr, fr, nf, ff] = def.legs.hips;
  const LEGS = [{ hx: fr, ph: 0, far: true }, { hx: ff, ph: 3, far: true }, { hx: nr, ph: 3, far: false }, { hx: nf, ph: 0, far: false }];

  // draw one frame at integer position (x, y = top-left), mode: stand | walk | bark | lie.
  // Time only picks a discrete pose (walk frame, tail stage, blink, mouth); each pose is painted once into a bitmap
  // and blitted afterwards, so a frame costs one drawImage per dog.
  const poses = new Map();
  function draw(ctx, x, y, { t = 0, mode = 'stand', flip = false, fps = 9, wagSpeed = 10 } = {}) {
    const lie = mode === 'lie';
    const wag = lie ? Math.sin(t * 2) * 0.3 : Math.sin(t * wagSpeed);
    const s = {
      mode, flip,
      f: mode === 'walk' ? Math.floor(t * fps) % 6 : 0,
      tail: Math.max(0, Math.min(4, Math.round((wag + 1) * 2))),
      blink: lie || (t % 3.3) < 0.15,
      mouth: mode === 'bark' && Math.floor(t * 6) % 2 === 0 ? 'open' : !lie && (mode !== 'stand' || Math.floor(t * 3) % 2 === 0) ? 'pant' : '',
    };
    const key = `${s.mode}|${s.flip}|${s.f}|${s.tail}|${s.blink}|${s.mouth}`;
    let bmp = poses.get(key);
    if (!bmp) {
      bmp = document.createElement('canvas');
      bmp.width = g.w; bmp.height = g.h + 4;
      paint(bmp.getContext('2d'), s);
      poses.set(key, bmp);
    }
    ctx.drawImage(bmp, x, y);
  }
  function paint(ctx, { mode, flip, f, tail, blink, mouth }) {
    const x = 0, y = 0;
    const lie = mode === 'lie';
    const drop = lie ? foot - def.legTop - 1 : 0;
    const bob = mode === 'walk' && f % 3 === 2 ? 1 : 0;
    const px = (gx, gy, c, m) => {
      if (!c) return;
      ctx.fillStyle = m > 0 ? shade(c, 0.16) : m === -1 ? shade(c, -0.16) : m <= -2 ? shade(c, -0.24 + (m + 2) * 0.1) : c;
      ctx.fillRect(flip ? x + g.w - 1 - gx : x + gx, y + gy, 1, 1);
    };
    const layer = (grid, oy, override) => {
      for (let gy = 0; gy < grid.h; gy++) for (let gx = 0; gx < grid.w; gx++) {
        let k = grid.k[gy * grid.w + gx];
        if (k === '.') continue;
        if (override) k = override(gx, gy, k) ?? k;
        px(gx, gy + oy, pal[k], grid.m[gy * grid.w + gx]);
      }
    };
    layer(tails[tail], drop + bob);
    if (!lie) {
      const back = new Grid(g.w, g.h + 2), front = new Grid(g.w, g.h + 2);
      for (const L of LEGS) {
        const [dx, lift] = mode === 'walk' ? CYCLE[(f + L.ph) % 6] : [0, 0];
        leg(L.far ? back : front, L.hx, dx, lift, L.far);
      }
      layer(back, 0);
      drawBody(drop + bob);
      layer(front, 0);
    } else {
      drawBody(drop);
      // front paws resting in front of the chest
      for (const off of [0, 4]) {
        const bx = nf + 1 + off, by = foot;
        for (let xx = bx - 2; xx <= bx + 2; xx++) { px(xx, by, pal.o); px(xx, by - 2, pal.o); px(xx, by - 1, xx === bx - 2 || xx === bx + 2 ? pal.o : pal[def.legs.low], off ? 0 : -1); }
      }
    }
    function drawBody(oy) {
      const [ex, ey] = def.eye, [mx, my] = def.mouth;
      layer(g, oy);
      // eye 2x2 with highlight, or closed lid
      if (blink) { px(ex, ey + oy, pal.o); px(ex + 1, ey + oy, pal.o); }
      else { px(ex, ey + oy, pal.E); px(ex + 1, ey + oy, pal.k); px(ex, ey + 1 + oy, pal.k); px(ex + 1, ey + 1 + oy, pal.k); }
      // mouth: panting tongue, barking open jaw
      if (mouth === 'open') {
        for (let xx = mx - 2; xx <= mx + 2; xx++) px(xx, my + oy, pal.o);
        px(mx - 1, my + 1 + oy, pal.P); px(mx, my + 1 + oy, pal.P); px(mx - 2, my + 1 + oy, pal.o); px(mx + 1, my + 1 + oy, pal.o);
        for (let xx = mx - 1; xx <= mx; xx++) px(xx, my + 2 + oy, pal.o);
      } else if (mouth === 'pant') {
        px(mx, my + oy, pal.P); px(mx + 1, my + oy, pal.P); px(mx, my + 1 + oy, pal.P); px(mx + 1, my + 1 + oy, pal.P);
        px(mx - 1, my + 1 + oy, pal.o); px(mx + 2, my + 1 + oy, pal.o); px(mx, my + 2 + oy, pal.o); px(mx + 1, my + 2 + oy, pal.o);
      }
    }
  }
  return { w: g.w, h: g.h + 1, draw, coat, breed: BREEDS[breedId], eye: def.eye, mouth: def.mouth, tag: def.tag, head: [def.eye[0], def.eye[1] - 6] };
}