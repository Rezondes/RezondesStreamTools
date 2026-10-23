// The stinger of the Kebab theme on a canvas (DESIGN-KEBAB.md "Stinger", prototype refs/stinger.html), built once per
// render: "papier" (wrap.ts) folds four flaps of printed wrapping paper in and tears it open after the cut, "messer"
// (slices.ts) lets a knife cut across while slices of meat cover the picture. Both show the badge in the middle: the
// arc title over a big spit. The clip time is mapped onto the drawing of 1.6 s with its cut at 0.8 s (designTime).
// Check: stinger.check.ts.
import { hash } from "../../core/hash.ts";
import { arcLetters, type ArcText, type BuiltInk, drawArc, drawInk, drawPrint, inkOf, type InkStyle, lineOf, type PlacedLetter } from "./clipInk.ts";
import { knifeAt, shavingsOffKnife, sliceAt, sliceHeight } from "./slices.ts";
import { designTime, FLAPS, flapPolygon, paperAt, PICTURE, tearEdge } from "./wrap.ts";

// The choices of stingerStyle in settings.ts
export type StingerStyle = "papier" | "messer";
type StingerColors = { red: string; redText: string; paper: string; brown: string };
export type StingerLook = {
  style: StingerStyle; text: string; duration: number; cut: number; jag: number; slices: number; shavings: boolean; seed: number;
  titleFont: string; ink: InkStyle; colors: StingerColors;
};

type Point = [number, number];
type Draw = (context: CanvasRenderingContext2D, time: number) => void;

// fixed: the badge of the prototype (an 800 x 660 box at 560 / 210): arc title (measured on the rendered prototype),
// cone and bar of the big spit, the rows of its meat
const BADGE = { x: 560, y: 210, width: 800, height: 660 };
const BADGE_ARC = { center: { x: 380, y: 680 }, radius: 600, span: 64, size: 106, stroke: 5 };
const CONE = "M362 350 C380 344 420 344 438 350 C452 420 452 500 434 560 L426 600 L374 600 L366 560 C348 500 348 420 362 350 Z";
const BAR = "M352 330 L448 330 M400 330 L400 350 M400 600 L400 640";
const ROWS = { count: 16, top: 362, gap: 15, left: 370, spread: 40 };
// fixed: how the letters grow (gap between letters, length, overshoot of back.out), how long the spit takes to be
// drawn in from the top and its paper to fade in; per style when letters and spit start and how the badge leaves
const GROW = { gap: 0.012, length: 0.22, back: 3 };
const DRAW_IN = 0.2;
const FADE_IN = 0.1;
const BADGE_TIMES: Record<StingerStyle, { letters: number; spit: number; leave: number; leaveLength: number }> = {
  papier: { letters: 0.55, spit: 0.6, leave: 0.92, leaveLength: 0.2 },
  messer: { letters: 0.6, spit: 0.62, leave: 0.95, leaveLength: 0.6 },
};
// fixed: papier: the badge shrinks to a fifth when it leaves; messer: it falls this far and turns this much (degrees)
const BADGE_SHRINK = 0.8;
const BADGE_FALL = { y: 1300, turn: 10 };
// fixed: papier: shadow of the flaps and the halves (in the dark brown); the halves reach past the picture so they stay closed when turned;
// they fly 1150 px to the sides and turn 7 degrees, like the prototype
const FLAP_SHADOW = { blur: 18, alpha: 0.45 };
const HALF_SHADOW = { blur: 22, alpha: 0.45 };
const MARGIN = 0.05;
const HALF_MOVE = { fly: 1150, turn: 7 };
// fixed: messer: the inset lines of a slice, the stripes of its meat (tile and strokes), the knife, the shavings
const SLICE_LINES = { top: 6, bottom: 3, bottomAlpha: 0.25, overlap: 1 };
const STRIPES = { width: 180, height: 60, alpha: 0.7, line: 3, salt: 20 };
const STRIPE = "M12 16 q10 -5 20 0 t20 0 M100 20 q8 -4 16 0 t16 0 M60 40 q10 -5 20 0 t20 0 M140 46 q8 -4 16 0 t16 0";
const HANDLE = "M0 70 L230 52 L230 92 L0 88 Z";
const BLADE = "M230 50 L1480 62 L1500 76 L230 96 Z";
const EDGE_LINE = "M250 66 L1440 70";
const SHAVING = { count: 60, line: 4, reach: { min: 10, spread: 8 }, salt: 39 };
// fixed: salts of the Rough lines
const SALT = { bar: 900, cone: 910, rows: 920, blade: 930, edge: 940 };

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeIn2 = (share: number) => share * share;
const backOut = (share: number, back: number) => 1 + (back + 1) * (share - 1) ** 3 + back * (share - 1) ** 2;
const radians = (degrees: number) => (degrees * Math.PI) / 180;

function polygon(context: CanvasRenderingContext2D, points: readonly Point[]) {
  context.beginPath();
  points.forEach(([x, y], index) => (index === 0 ? context.moveTo(x, y) : context.lineTo(x, y)));
  context.closePath();
}

// The badge: arc title and big spit; letters grow one after another, the spit is drawn in from the top
function makeBadge(look: StingerLook): Draw {
  const arc: ArcText = { text: look.text, ...BADGE_ARC, font: look.titleFont, colors: { fill: look.colors.paper, stroke: look.colors.red } };
  let rows = "";
  for (let row = 0; row < ROWS.count; row++) rows += `M${ROWS.left + hash(look.seed * 100 + row) * ROWS.spread} ${ROWS.top + row * ROWS.gap} q10 -4 20 0 t20 0 `;
  const ink = (outline: string, width: number, salt: number) => inkOf(lineOf({ kind: "path", d: outline }, width), look.ink, salt);
  const spit: BuiltInk[] = [ink(BAR, 6, SALT.bar), ink(CONE, 6, SALT.cone), ink(rows, 4, SALT.rows)];
  const cone = new Path2D(CONE);
  const times = BADGE_TIMES[look.style];
  let letters: PlacedLetter[] | null = null;
  return (context, time) => {
    if (time < times.letters) return;
    letters ??= arcLetters(context, arc);
    const leaving = easeIn2(clamp01((time - times.leave) / times.leaveLength));
    context.save();
    context.translate(PICTURE.width / 2, PICTURE.height / 2);
    if (look.style === "papier") {
      context.globalAlpha = 1 - leaving;
      context.scale(1 - BADGE_SHRINK * leaving, 1 - BADGE_SHRINK * leaving);
    } else {
      context.translate(0, leaving * BADGE_FALL.y);
      context.rotate(radians(leaving * BADGE_FALL.turn));
    }
    context.translate(BADGE.x - PICTURE.width / 2, BADGE.y - PICTURE.height / 2);
    const drawn = clamp01((time - times.spit) / DRAW_IN);
    if (drawn > 0) {
      context.save();
      context.globalAlpha *= clamp01((time - times.spit) / FADE_IN);
      context.fillStyle = look.colors.paper;
      context.fill(cone);
      context.restore();
      context.save();
      context.beginPath();
      context.rect(0, 0, BADGE.width, BADGE.height * drawn);
      context.clip();
      for (const part of spit) drawInk(context, part, { ink: look.colors.red, fill: look.colors.paper });
      context.restore();
    }
    drawArc(context, arc, letters, index => {
      const share = clamp01((time - times.letters - index * GROW.gap) / GROW.length);
      return share <= 0 ? 0 : backOut(share, GROW.back);
    });
    context.restore();
  };
}

// papier: flaps fold in with their shadow, the sheet stands whole, then two halves with a shared jagged edge fly apart
function makePaper(look: StingerLook): Draw {
  const { width, height } = PICTURE;
  const edge = tearEdge(look.seed, look.jag);
  const halves: Point[][] = [
    [[-MARGIN * width, -MARGIN * height], ...edge, [-MARGIN * width, (1 + MARGIN) * height]],
    [[(1 + MARGIN) * width, -MARGIN * height], ...edge, [(1 + MARGIN) * width, (1 + MARGIN) * height]],
  ];
  const whole: Point[] = [[0, 0], [width, 0], [width, height], [0, height]];
  // the shadow is cast by a faint copy of the sheet, the sheet itself covers it inside
  const sheet = (context: CanvasRenderingContext2D, points: readonly Point[], shadow: { blur: number; alpha: number } | null) => {
    context.fillStyle = look.colors.paper;
    if (shadow) {
      context.save();
      context.shadowBlur = shadow.blur;
      context.shadowColor = look.colors.brown;
      context.globalAlpha = shadow.alpha;
      polygon(context, points);
      context.fill();
      context.restore();
    }
    polygon(context, points);
    context.fill();
    context.save();
    polygon(context, points);
    context.clip();
    drawPrint(context, width, height, look.colors.red);
    context.restore();
  };
  return (context, time) => {
    const paper = paperAt(time);
    if (paper.flaps) {
      paper.flaps.forEach((share, index) => {
        if (share > 0) sheet(context, flapPolygon(FLAPS[index], share), FLAP_SHADOW);
      });
      return;
    }
    // until the tear the paper is one piece without a shadow, so no seam shows
    if (paper.whole) {
      sheet(context, whole, null);
      return;
    }
    halves.forEach((half, index) => {
      const side = index === 0 ? -1 : 1;
      context.save();
      context.translate(width / 2 + side * HALF_MOVE.fly * paper.apart, height / 2);
      context.rotate(radians(side * HALF_MOVE.turn * paper.apart));
      context.translate(-width / 2, -height / 2);
      sheet(context, half, HALF_SHADOW);
      context.restore();
    });
  };
}

// messer: one slice of meat slid in from the left (it falls after the cut): red with stripes, a dark line on top
function drawSlice(context: CanvasRenderingContext2D, look: StingerLook, place: { x: number; y: number; turn: number }, top: number, tall: number, shift: number, stripe: Path2D) {
  context.save();
  context.translate(place.x + PICTURE.width / 2, top + place.y + tall / 2);
  context.rotate(radians(place.turn));
  context.translate(-PICTURE.width / 2, -tall / 2);
  context.beginPath();
  context.rect(0, 0, PICTURE.width, tall);
  context.clip();
  context.fillStyle = look.colors.red;
  context.fillRect(0, 0, PICTURE.width, tall);
  context.strokeStyle = look.colors.paper;
  context.globalAlpha = STRIPES.alpha;
  context.lineWidth = STRIPES.line;
  context.lineCap = "round";
  for (let y = 0; y < tall; y += STRIPES.height) {
    for (let x = shift - STRIPES.width; x < PICTURE.width; x += STRIPES.width) {
      context.save();
      context.translate(x, y);
      context.stroke(stripe);
      context.restore();
    }
  }
  context.globalAlpha = 1;
  context.fillStyle = look.colors.redText;
  context.fillRect(0, 0, PICTURE.width, SLICE_LINES.top);
  context.fillStyle = look.colors.brown;
  context.globalAlpha = SLICE_LINES.bottomAlpha;
  context.fillRect(0, tall - SLICE_LINES.bottom, PICTURE.width, SLICE_LINES.bottom);
  context.restore();
}

// messer: shavings that left the blade, each a small curl
function drawShavings(context: CanvasRenderingContext2D, look: StingerLook, time: number) {
  context.save();
  context.strokeStyle = look.colors.red;
  context.lineWidth = SHAVING.line;
  context.lineCap = "round";
  shavingsOffKnife(time, SHAVING.count, look.seed).forEach((shaving, index) => {
    const reach = SHAVING.reach.min + hash(look.seed * 1000 + index + SHAVING.salt) * SHAVING.reach.spread;
    const cos = Math.cos(shaving.spin);
    const sin = Math.sin(shaving.spin);
    context.globalAlpha = shaving.alpha;
    context.beginPath();
    context.moveTo(shaving.x - cos * reach, shaving.y - sin * reach);
    context.quadraticCurveTo(shaving.x - sin * reach, shaving.y + cos * reach, shaving.x + cos * reach, shaving.y + sin * reach);
    context.stroke();
  });
  context.restore();
}

// messer: slices of meat slide in from the left (the lowest first) and fall after the cut; in front of the badge the
// knife crosses and shavings fly off its blade
function makeKnife(look: StingerLook): { slices: Draw; knife: Draw } {
  const rows = Math.max(1, Math.round(look.slices));
  const band = sliceHeight(rows);
  const tall = band + 2 * SLICE_LINES.overlap;
  const shifts = Array.from({ length: rows }, (_, row) => hash(look.seed * 100 + row + STRIPES.salt) * STRIPES.width);
  const stripe = new Path2D(STRIPE);
  const handle = new Path2D(HANDLE);
  const blade = new Path2D(BLADE);
  const bladeInk = [inkOf(lineOf({ kind: "path", d: BLADE }, 6), look.ink, SALT.blade), inkOf(lineOf({ kind: "path", d: EDGE_LINE }, 3), look.ink, SALT.edge)];
  return {
    slices: (context, time) => {
      for (let row = 0; row < rows; row++) drawSlice(context, look, sliceAt(row, rows, time, look.seed), row * band - SLICE_LINES.overlap, tall, shifts[row], stripe);
    },
    knife: (context, time) => {
      const at = knifeAt(time);
      context.save();
      context.translate(at.x, at.y);
      context.rotate(radians(at.angle));
      context.fillStyle = look.colors.brown;
      context.fill(handle);
      context.fillStyle = look.colors.paper;
      context.fill(blade);
      for (const part of bladeInk) drawInk(context, part, { ink: look.colors.red, fill: look.colors.paper });
      context.restore();
      if (look.shavings) drawShavings(context, look, time);
    },
  };
}

export function makeStinger(look: StingerLook): Draw {
  const badge = makeBadge(look);
  const layers: Draw[] = look.style === "papier" ? [makePaper(look), badge] : (({ slices, knife }) => [slices, badge, knife])(makeKnife(look));
  return (context, time) => {
    const at = designTime(time, look.duration, look.cut);
    context.clearRect(0, 0, PICTURE.width, PICTURE.height);
    for (const layer of layers) layer(context, at);
  };
}
