// Stinger of the Bärenbande theme: the chosen bear (or the tower) walks in from one side and pulls a curtain behind it
// across the picture, the edge of the curtain in its paw (rig.ts, poses pullA and pullB). At the transition point the
// curtain covers everything and shows the text; the bear peeks in at the edge, turns its head to the camera and blinks.
// Then it pulls the curtain open toward where it came from (ziehen) or the curtain rises (heben). The curtain in the
// style of the theme: flat fabric with folds in one shade tone, the outline at its free edges, a hem, paw prints if
// wanted. Before and after transparent. Drawn from the character model (paint.ts). Pure function of time, so it can be
// rendered frame by frame. Check: stinger.check.ts.
import { clamp01, easeIn, easeInOut } from "../../core/easing.ts";
import { isBearChoice, oval, TOWER } from "./bears.ts";
import { drawBear, drawTower, mix, pawX, shapeOf, TOWER_SIZE, type Palette } from "./paint.ts";
import { POSES, type PoseName } from "./rig.ts";

export const WIDTH = 1920;
export const HEIGHT = 1080;

export type CurtainLook = { color: string; shade: string; pattern: boolean; folds: number };
export type BearsStingerOptions = {
  duration: number; // seconds
  cut: number; // seconds, enter in OBS as transition point
  bear: string; // a bear id or the tower
  text: string;
  font: string;
  waddle: number; // degrees
  palette: Palette;
  curtain: CurtainLook;
  from: string; // side the bear comes from: links or rechts
  open: string; // how the curtain opens after the cut: ziehen or heben
};

// fixed: size and ground of the figure, share of the closing walk before the cut, steps per second, how far the bear
// peeks in, how long the blink lasts, the outside margin, the hem and the paw print grid of the curtain
const BEAR_HEIGHT = 560;
const TOWER_HEIGHT = 720;
const GROUND = HEIGHT - 40;
const CLOSING = 0.8;
const STEPS_PER_SECOND = 3;
const PEEK = 0.15;
const BLINK_S = 0.06;
const MARGIN = 20;
const HEM = 36;
const PRINTS = { gap: 260, size: 22, start: 140 };

// The figure at a moment: where it stands (x of its middle on the ground), where it looks (1 = left, -1 = right, as for
// drawBear), its pose, the turn of its head toward the camera and whether it walks
export type StingerBear = { x: number; facing: 1 | -1; pose: PoseName; turn: number; walking: boolean };
// The whole picture at a moment (for the side "links"; "rechts" is drawn mirrored): the figure, the curtain from the
// left margin to edge and from the top margin down to bottom
export type StingerState = { bear: StingerBear; edge: number; bottom: number };

const choiceOf = (bear: string) => (isBearChoice(bear) ? bear : "grizzly");
export const figureHeight = (bear: string) => (choiceOf(bear) === TOWER ? TOWER_HEIGHT : BEAR_HEIGHT);
const figureWidth = (bear: string) =>
  choiceOf(bear) === TOWER ? (TOWER_SIZE.width / TOWER_SIZE.height) * TOWER_HEIGHT : (POSES.stand.width / POSES.stand.height) * BEAR_HEIGHT;

export function stingerState(time: number, options: BearsStingerOptions): StingerState | null {
  const { cut, duration } = options;
  if (time <= 0 || time >= duration) return null;
  const width = figureWidth(options.bear);
  const [start, out, peek, end] = [-width, WIDTH + width, WIDTH + width * PEEK, -width * 1.2];
  const step: PoseName = Math.floor(time * STEPS_PER_SECOND * 2) % 2 === 0 ? "pullA" : "pullB";
  const closed = cut * CLOSING;
  // Around the cut the head turns to the camera, right at the cut the bear blinks
  const turn = 0.5 * clamp01(1 - Math.abs(time - cut) / (duration * 0.15));
  const walk = (x: number, facing: 1 | -1, headTurn = 0): StingerBear => ({ x, facing, pose: step, turn: headTurn, walking: true });
  const standing = (x: number): StingerBear => ({ x, facing: 1, pose: Math.abs(time - cut) < BLINK_S ? "blink" : "stand", turn, walking: false });
  let bear: StingerBear;
  if (time < closed) bear = walk(start + (out - start) * easeInOut(time / closed), -1);
  else if (time < cut) bear = walk(out + (peek - out) * easeInOut((time - closed) / (cut - closed)), 1, turn);
  else {
    const going = clamp01(((time - cut) / (duration - cut) - 0.2) / 0.8);
    if (going <= 0) bear = standing(peek);
    else if (options.open === "heben") bear = walk(peek + (out - peek) * easeIn(going), -1);
    else bear = walk(peek + (end - peek) * easeIn(going), 1);
  }
  // The edge is in the paw while the bear pulls; when the curtain rises it spans the whole picture and its hem goes up
  const rising = time >= cut && options.open === "heben";
  const paw = pawX(choiceOf(options.bear), bear.pose, bear.x, figureHeight(options.bear), bear.facing, bear.turn);
  const lift = rising ? easeIn(clamp01((time - cut) / (duration - cut) / 0.8)) : 0;
  return { bear, edge: rising ? WIDTH + MARGIN : paw, bottom: HEIGHT + MARGIN - (HEIGHT + 2 * MARGIN + HEM) * lift };
}

// A paw print (pad and three toes) at (x, y)
function pawPrint(context: CanvasRenderingContext2D, x: number, y: number, size: number) {
  context.fill(shapeOf(oval(x, y, size, size * 0.8)));
  for (const [dx, dy] of [[-0.9, -1.1], [0, -1.45], [0.9, -1.1]]) context.fill(shapeOf(oval(x + dx * size, y + dy * size, size * 0.38, size * 0.45)));
}

// The curtain from the left margin to its edge, from the top margin down to its bottom: fabric, folds swaying a little,
// paw prints, hem, the outline at the free edges
function drawCurtain(context: CanvasRenderingContext2D, time: number, state: StingerState, look: CurtainLook, palette: Palette) {
  const [left, top, right, bottom] = [-MARGIN, -MARGIN, state.edge, state.bottom];
  if (right <= left || bottom <= top) return;
  context.fillStyle = look.color;
  context.fillRect(left, top, right - left, bottom - top);
  const folds = Math.max(1, Math.round(look.folds));
  const spacing = (right - left) / folds;
  const tall = bottom - top;
  context.fillStyle = look.shade;
  for (let index = 0; index < folds; index++) {
    const x = left + spacing * (index + 0.6) + Math.sin(time * 4 + index) * spacing * 0.06;
    const band = spacing * 0.32;
    context.fill(shapeOf(
      `M${x} ${top} C${x + band * 0.6} ${top + tall * 0.3} ${x - band * 0.2} ${top + tall * 0.7} ${x + band * 0.3} ${bottom} ` +
      `L${x + band} ${bottom} C${x + band * 0.6} ${top + tall * 0.6} ${x + band * 1.2} ${top + tall * 0.3} ${x + band} ${top} Z`,
    ));
  }
  if (look.pattern) {
    context.fillStyle = mix(look.color, palette.paper, 0.35);
    for (let row = 0, y = PRINTS.start; y < bottom - HEM; row++, y += PRINTS.gap) {
      for (let x = PRINTS.start + (row % 2) * (PRINTS.gap / 2); x < right - PRINTS.size * 2; x += PRINTS.gap) pawPrint(context, x, y, PRINTS.size);
    }
  }
  context.fillStyle = mix(look.shade, palette.outline, 0.2);
  context.fillRect(left, bottom - HEM, right - left, HEM);
  context.strokeStyle = palette.outline;
  context.lineWidth = palette.outlineWidth * 1.5;
  context.lineJoin = "round";
  context.stroke(shapeOf(`M${left} ${bottom - HEM} L${right} ${bottom - HEM} M${left} ${bottom} L${right} ${bottom} M${right} ${top} L${right} ${bottom}`));
}

// The bear (or the tower) on the ground, rocking from side to side around its feet while it walks
function drawFigure(context: CanvasRenderingContext2D, time: number, bear: StingerBear, options: BearsStingerOptions) {
  const choice = choiceOf(options.bear);
  context.save();
  context.translate(bear.x, GROUND);
  if (bear.walking) context.rotate((Math.sin(time * Math.PI * 2 * STEPS_PER_SECOND) * options.waddle * Math.PI) / 180);
  if (choice === TOWER) drawTower(context, 0, 0, TOWER_HEIGHT, options.palette, bear.facing);
  else drawBear(context, choice, bear.pose, 0, 0, BEAR_HEIGHT, options.palette, bear.facing, bear.turn);
  context.restore();
}

export function drawBearsStinger(context: CanvasRenderingContext2D, time: number, options: BearsStingerOptions) {
  context.clearRect(0, 0, WIDTH, HEIGHT);
  const state = stingerState(time, options);
  if (!state) return;
  context.save();
  // From the right: the same scene mirrored
  if (options.from === "rechts") {
    context.translate(WIDTH, 0);
    context.scale(-1, 1);
  }
  drawCurtain(context, time, state, options.curtain, options.palette);
  drawFigure(context, time, state.bear, options);
  context.restore();

  // The text on the curtain around the transition point
  const { cut, duration } = options;
  const shown = 1 - clamp01(Math.abs(time - cut) / (Math.min(cut, duration - cut) * 0.6));
  if (shown <= 0) return;
  context.save();
  context.globalAlpha = shown;
  context.font = `800 150px "${options.font}", sans-serif`;
  context.textBaseline = "middle";
  context.lineJoin = "round";
  context.lineWidth = options.palette.outlineWidth * 4;
  context.strokeStyle = options.palette.outline;
  context.fillStyle = options.palette.paper;
  const width = context.measureText(options.text).width;
  context.strokeText(options.text, (WIDTH - width) / 2, HEIGHT / 2);
  context.fillText(options.text, (WIDTH - width) / 2, HEIGHT / 2);
  context.restore();
}
