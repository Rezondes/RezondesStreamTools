/* eslint-disable -- reference prototype outside the build (THEMES.md, docs/refs), not held to the code rules */
// Shared pieces for the pixel scenes: a 384 x 216 canvas shown 5x on the 1920 x 1080 stage, plus pixel props.
// Every prop is drawn at integer pixels so the scaled canvas keeps hard edges.
import { hash } from './common.js';

export const PW = 384, PH = 216, PX = 5;
export const INK = '#2e1d14';

export function pixelCanvas(stage) {
  const c = document.createElement('canvas');
  c.width = PW; c.height = PH; c.className = 'px';
  stage.insertBefore(c, stage.firstChild);
  return c.getContext('2d');
}
// place an HTML element at pixel coordinates of the canvas
export const place = (el, x, y) => { el.style.left = `${Math.round(x) * PX}px`; el.style.top = `${Math.round(y) * PX}px`; };

export const rect = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
export function disc(ctx, cx, cy, rx, ry, c, half = false) {
  ctx.fillStyle = c;
  for (let y = -ry; y <= (half ? 0 : ry); y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y / ry) ** 2)));
    ctx.fillRect(Math.round(cx - w), Math.round(cy + y), 2 * w + 1, 1);
  }
}
// outlined disc: ink ring one pixel wider, then the fill
export function odisc(ctx, cx, cy, rx, ry, c, half = false) { disc(ctx, cx, cy, rx + 1, ry + 1, INK, half); disc(ctx, cx, cy, rx, ry, c, half); }

// sprite from text rows; '.' or a missing palette key is empty
export function sprite(ctx, x, y, rows, pal, flip = false) {
  x = Math.round(x); y = Math.round(y);
  rows.forEach((row, r) => {
    for (let i = 0; i < row.length; i++) {
      const c = pal[row[i]];
      if (c) { ctx.fillStyle = c; ctx.fillRect(x + (flip ? row.length - 1 - i : i), y + r, 1, 1); }
    }
  });
}
export const PAL = { o: INK, R: '#c94a3a', r: '#e2735f', W: '#ffffff', Y: '#ffd23f', y: '#e8a91c', C: '#fff6e6', c: '#e9d2bd', B: '#a8754a', b: '#7d5233', P: '#f7a6c1', L: '#c9b6ff', G: '#6fbf5a' };
export const SPR = {
  heart: ['.oo.oo.', 'oRRoRRo', 'oRWRRRo', 'oRRRRRo', '.oRRRo.', '..oRo..', '...o...'],
  ball: ['..oooo..', '.oYYYYo.', 'oYWWYYyo', 'oYWYYYyo', 'oYYYYyyo', 'oyYYyyyo', '.oyyyyo.', '..oooo..'],
  bone: ['.ooo...ooo.', 'oCCCoooCCCo', '.oCCCCCCCo.', '.oCCCCCCco.', 'occcoooccco', '.ooo...ooo.'],
  frisbee: ['..ooooooo..', '.oRrrrrrRo.', 'oRRRRRRRRRo', '.ooooooooo.'],
  treat: ['..oooo..', '.oBBBBo.', 'oBbBBbBo', 'oBBBBBBo', 'oBBbBBbo', '.oBBBBo.', '..oooo..'],
  zz: ['ooooo', '...o.', '..o..', '.o...', 'ooooo'],
  fly1: ['oP.Po', 'PPoPP', '.PoP.', 'P.o.P'],
  fly2: ['.....', 'oPoPo', 'PPoPP', '..o..'],
};

// ---------- outdoor props ----------
export function sky(ctx, top, bottom, h, bands = 6) {
  const a = top.match(/\w\w/g).map((v) => parseInt(v, 16)), b = bottom.match(/\w\w/g).map((v) => parseInt(v, 16));
  for (let i = 0; i < bands; i++) {
    const k = i / (bands - 1);
    rect(ctx, 0, Math.round((h * i) / bands), PW, Math.ceil(h / bands) + 1, `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * k)).join(',')})`);
  }
}
export function cloud(ctx, x, y, s = 1) {
  const blobs = [[0, 2, 7, 4], [8, -1, 9, 7], [17, 2, 7, 4]];
  for (const [bx, by, rx, ry] of blobs) disc(ctx, x + bx * s, y + by * s + 1, rx * s, ry * s, '#d8eefc');
  for (const [bx, by, rx, ry] of blobs) disc(ctx, x + bx * s, y + by * s, rx * s, ry * s, '#ffffff');
  rect(ctx, x - 6 * s, y + 4 * s, 30 * s, 2 * s, '#ffffff');
}
export function hill(ctx, cx, base, rx, ry, c) { disc(ctx, cx, base, rx, ry, c, true); }
export function tree(ctx, x, ground, s = 1, seed = 0) {
  rect(ctx, x - 3 * s, ground - 16 * s, 6 * s + 2, 16 * s, INK);
  rect(ctx, x - 2 * s, ground - 16 * s, 6 * s, 16 * s, '#a8754a');
  rect(ctx, x - 2 * s, ground - 16 * s, 2 * s, 16 * s, '#8a5d38');
  const blobs = [[0, -24, 11, 9], [-7, -18, 8, 6], [8, -17, 8, 6], [1, -31, 7, 6]];
  for (const [bx, by, rx, ry] of blobs) odisc(ctx, x + bx * s + 1, ground + by * s, rx * s, ry * s, '#4f9a45');
  for (const [bx, by, rx, ry] of blobs) disc(ctx, x + bx * s + 1, ground + by * s - 1, rx * s - 1, ry * s - 1, '#6fbf5a');
  for (const [bx, by, rx] of blobs) disc(ctx, x + bx * s - rx * s * 0.3, ground + by * s - 3 * s, 2 * s, 1 * s, '#8fd16a');
  if (hash(seed, 9) > 0.6) for (let k = 0; k < 3; k++) rect(ctx, x + (hash(seed, k) * 16 - 8) * s, ground + (-28 + hash(seed, k, 2) * 12) * s, 2, 2, '#f25c54');
}
// fence across the whole width, scrolled by `off` pixels
export function fence(ctx, y, off = 0, gap = 16) {
  for (const ry of [y + 4, y + 9]) { rect(ctx, 0, ry - 1, PW, 4, INK); rect(ctx, 0, ry, PW, 2, '#ffffff'); }
  const o = ((Math.round(off) % gap) + gap) % gap;
  for (let x = -o; x < PW + gap; x += gap) {
    rect(ctx, x - 1, y - 1, 6, 16, INK); rect(ctx, x, y + 1, 4, 14, '#ffffff'); rect(ctx, x + 3, y + 1, 1, 14, '#dfe6ee');
    rect(ctx, x + 1, y - 2, 2, 1, INK); rect(ctx, x + 1, y - 1, 2, 2, '#ffffff');
  }
}
// grass from y down to the bottom with a light top edge and tufts; flowers scroll with `off`
export function meadow(ctx, y, off = 0, flowers = 40) {
  rect(ctx, 0, y, PW, PH - y, '#86c45f');
  rect(ctx, 0, y, PW, 2, '#a3d97a');
  const span = PW + 40;
  for (let i = 0; i < flowers; i++) {
    const fx = (((hash(i, 1) * span - off) % span) + span) % span - 20, fy = y + 4 + hash(i, 2) * (PH - y - 6);
    if (i % 3) { rect(ctx, fx, fy, 3, 1, '#6fae4c'); rect(ctx, fx + 1, fy - 1, 1, 1, '#6fae4c'); }
    else { const c = ['#ffffff', '#ffd23f', '#f7a6c1', '#c9b6ff'][i % 4]; rect(ctx, fx, fy, 1, 1, c); rect(ctx, fx - 1, fy + 1, 3, 1, c); rect(ctx, fx, fy + 2, 1, 1, c); rect(ctx, fx, fy + 1, 1, 1, '#ffd23f'); }
  }
}
// cushion / rug: outlined flat ellipse with a lighter top and white piping
export function cushion(ctx, cx, y, rx, c) {
  odisc(ctx, cx, y + 1, rx, 4, c);
  disc(ctx, cx, y, rx - 2, 2, '#ffffff');
  disc(ctx, cx, y, rx - 3, 2, c);
}