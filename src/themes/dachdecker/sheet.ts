// The drawing on the blueprint of the Dachdecker stinger (stinger.ts puts it on the sheet that rolls out): a sheet with
// millimetre grid and double border, the title in terracotta with the subtitle, a house elevation with roof truss,
// windows, door, hatched ground and dimensions in metres from the roof frame settings, a section and a north marker,
// notes, a title block and a stamp. All of it is printed on the paper, so it rolls in and out with it. Plain 2D canvas
// drawing, the same for the same settings. Check: sheet.check.ts.
type SheetColors = { blueprint: string; line: string; accent: string; copper: string; muted: string; brick: string };
export type SheetOptions = {
  width: number; height: number; grid: number; font: string; colors: SheetColors;
  title: string; subtitle: string; block: readonly string[]; notes: readonly string[]; stamp: string;
  span: number; rise: number; // roof frame in metres (frame settings)
};

// Layout in shares of the sheet height (unit) or width; fine grid = a fifth of the grid
const MARGIN = 0.04;
const INSET = 0.008;
const TITLE = { y: 0.17, size: 0.11, track: 0.008, subY: 0.255, subSize: 0.026, subTrack: 0.012 };
const HOUSE = { x: 0.4, base: 0.8, span: 0.4, wall: 0.17, over: 0.06, sill: 0.035, window: [0.06, 0.07], door: [0.045, 0.12] };
const BLOCK = { width: 0.27, row: 0.055, label: 0.018, value: 0.022, split: 0.36 };
const NOTES = { x: 0.06, y: 0.36, size: 0.017, gap: 0.03 };
const STAMP = { x: 0.84, y: 0.56, size: 0.03, angle: -0.2, pad: 0.012 };
const MARKER = { radius: 0.022 };
const LINE = { thin: 1, mid: 2, thick: 4 };
const ALPHA = { fine: 0.05, grid: 0.12, inset: 0.4, hatch: 0.18, roof: 0.15 };
const DECIMALS = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const metres = (value: number) => `${DECIMALS.format(value)} m`;

type Pen = { context: CanvasRenderingContext2D; options: SheetOptions; unit: number };
type Point = readonly [number, number];

function stroke(pen: Pen, color: string, width: number, path: (context: CanvasRenderingContext2D) => void, alpha = 1) {
  const { context } = pen;
  context.save();
  context.strokeStyle = color;
  context.lineWidth = width;
  context.globalAlpha = alpha;
  context.beginPath();
  path(context);
  context.stroke();
  context.restore();
}

function write(pen: Pen, value: string, at: Point, look: { size: number; color: string; track?: number; align?: CanvasTextAlign }) {
  if (!value) return;
  const { context, options } = pen;
  context.save();
  context.font = `700 ${look.size}px "${options.font}"`;
  context.letterSpacing = `${look.track ?? 0}px`;
  context.textAlign = look.align ?? "center";
  context.textBaseline = "middle";
  context.fillStyle = look.color;
  context.fillText(value, ...at);
  context.restore();
}

function grid(pen: Pen) {
  const { options } = pen;
  const lines = (step: number) => (context: CanvasRenderingContext2D) => {
    for (let x = 0; x <= options.width; x += step) { context.moveTo(x, 0); context.lineTo(x, options.height); }
    for (let y = 0; y <= options.height; y += step) { context.moveTo(0, y); context.lineTo(options.width, y); }
  };
  stroke(pen, options.colors.line, LINE.thin, lines(options.grid / 5), ALPHA.fine);
  stroke(pen, options.colors.line, LINE.thin, lines(options.grid), ALPHA.grid);
}

function border(pen: Pen) {
  const { options, unit } = pen;
  const margin = unit * MARGIN;
  const inset = margin + unit * INSET;
  stroke(pen, options.colors.line, LINE.mid, context => context.rect(margin, margin, options.width - 2 * margin, options.height - 2 * margin));
  stroke(pen, options.colors.line, LINE.thin, context => context.rect(inset, inset, options.width - 2 * inset, options.height - 2 * inset), ALPHA.inset);
}

// Dimension line between two points with ticks, the text above it (left of it, turned, when vertical)
function dimension(pen: Pen, from: Point, to: Point, text: string) {
  const { context, options, unit } = pen;
  const tick = unit * 0.012;
  const vertical = from[0] === to[0];
  stroke(pen, options.colors.line, LINE.thin, path => {
    path.moveTo(...from);
    path.lineTo(...to);
    for (const [x, y] of [from, to]) {
      if (vertical) { path.moveTo(x - tick, y); path.lineTo(x + tick, y); } else { path.moveTo(x, y - tick); path.lineTo(x, y + tick); }
      path.moveTo(x - tick, y + tick);
      path.lineTo(x + tick, y - tick);
    }
  });
  const size = unit * 0.02;
  const look = { size, color: options.colors.copper, track: size * 0.1 };
  if (!vertical) return write(pen, text, [(from[0] + to[0]) / 2, from[1] - size], look);
  context.save();
  context.translate(from[0] - size, (from[1] + to[1]) / 2);
  context.rotate(-Math.PI / 2);
  write(pen, text, [0, 0], look);
  context.restore();
}

function marker(pen: Pen, at: Point, letter: string) {
  const { options, unit } = pen;
  const radius = unit * MARKER.radius;
  stroke(pen, options.colors.line, LINE.mid, path => {
    path.arc(at[0], at[1], radius, 0, Math.PI * 2);
    path.moveTo(at[0], at[1] - radius * 1.8);
    path.lineTo(at[0], at[1] - radius);
  });
  write(pen, letter, at, { size: radius * 1.1, color: options.colors.line });
}

// Walls with hatch, two windows with crosses and a door
function walls(pen: Pen, left: number, eave: number, span: number, base: number) {
  const { context, options, unit } = pen;
  const { colors } = options;
  context.save();
  context.beginPath();
  context.rect(left, eave, span, base - eave);
  context.clip();
  stroke(pen, colors.line, LINE.thin, path => {
    for (let x = left - (base - eave); x < left + span; x += unit * 0.025) { path.moveTo(x, base); path.lineTo(x + (base - eave), eave); }
  }, ALPHA.hatch);
  context.restore();
  stroke(pen, colors.line, LINE.mid, path => path.rect(left, eave, span, base - eave));
  const openings = [
    ...[left + span * 0.2, left + span * 0.8 - unit * HOUSE.window[0]].map(x => ({ x, y: eave + unit * HOUSE.sill, size: HOUSE.window, cross: true })),
    { x: left + span / 2 - (unit * HOUSE.door[0]) / 2, y: base - unit * HOUSE.door[1], size: HOUSE.door, cross: false },
  ];
  for (const { x, y, size, cross } of openings) {
    const [wide, high] = size.map(share => unit * share);
    context.fillStyle = colors.blueprint;
    context.fillRect(x, y, wide, high);
    stroke(pen, colors.line, LINE.mid, path => {
      path.rect(x, y, wide, high);
      if (!cross) return;
      path.moveTo(x + wide / 2, y); path.lineTo(x + wide / 2, y + high);
      path.moveTo(x, y + high / 2); path.lineTo(x + wide, y + high / 2);
    });
  }
}

// Roof: light terracotta face, rafters with overhang in terracotta, king post, collar tie and struts in white
function roof(pen: Pen, left: number, right: number, eave: number, rise: number) {
  const { context, options } = pen;
  const { colors } = options;
  const span = right - left;
  const middle = (left + right) / 2;
  const top = eave - rise;
  const over = span * HOUSE.over;
  const drop = over * (rise / (span / 2));
  const outline = (path: CanvasRenderingContext2D) => { path.moveTo(left - over, eave + drop); path.lineTo(middle, top); path.lineTo(right + over, eave + drop); };
  context.save();
  context.fillStyle = colors.accent;
  context.globalAlpha = ALPHA.roof;
  context.beginPath();
  outline(context);
  context.closePath();
  context.fill();
  context.restore();
  stroke(pen, colors.accent, LINE.thick, outline);
  stroke(pen, colors.line, LINE.mid, path => {
    path.moveTo(left, eave); path.lineTo(right, eave);
    path.moveTo(middle, top); path.lineTo(middle, eave);
    path.moveTo(middle - span / 4, eave - rise / 2); path.lineTo(middle + span / 4, eave - rise / 2);
    path.moveTo(middle - span / 4, eave); path.lineTo(middle, eave - rise / 2); path.lineTo(middle + span / 4, eave);
  });
  return over;
}

// House elevation with ground, dimensions in metres, section marker A and the north marker
function house(pen: Pen) {
  const { options, unit } = pen;
  const span = options.width * HOUSE.span;
  const left = options.width * HOUSE.x - span / 2;
  const right = left + span;
  const base = unit * HOUSE.base;
  const eave = base - unit * HOUSE.wall;
  const rise = span * (options.rise / Math.max(0.1, options.span));
  walls(pen, left, eave, span, base);
  const over = roof(pen, left, right, eave, rise);
  const ground = [left - span * 0.15, right + span * 0.15] as const;
  stroke(pen, options.colors.line, LINE.mid, path => { path.moveTo(ground[0], base); path.lineTo(ground[1], base); });
  stroke(pen, options.colors.line, LINE.thin, path => {
    for (let x = ground[0]; x < ground[1]; x += unit * 0.02) { path.moveTo(x, base + unit * 0.02); path.lineTo(x + unit * 0.02, base); }
  }, ALPHA.inset);
  dimension(pen, [left, base + unit * 0.06], [right, base + unit * 0.06], metres(options.span));
  dimension(pen, [right + over + unit * 0.05, eave], [right + over + unit * 0.05, eave - rise], metres(options.rise));
  marker(pen, [left - span * 0.12, eave - rise / 2], "A");
  marker(pen, [options.width - unit * (MARGIN + 0.07), unit * (MARGIN + 0.07)], "N");
}

// Title block bottom right: rows "label | value", the label small in grey, the value in white
function block(pen: Pen) {
  const { context, options, unit } = pen;
  const rows = options.block.filter(Boolean);
  if (rows.length === 0) return;
  const margin = unit * (MARGIN + INSET);
  const width = options.width * BLOCK.width;
  const row = unit * BLOCK.row;
  const x = options.width - margin - width;
  const y = options.height - margin - row * rows.length;
  context.fillStyle = options.colors.blueprint;
  context.fillRect(x, y, width, row * rows.length);
  stroke(pen, options.colors.line, LINE.mid, path => {
    path.rect(x, y, width, row * rows.length);
    rows.forEach((_, index) => { if (index) { path.moveTo(x, y + index * row); path.lineTo(x + width, y + index * row); } });
    path.moveTo(x + width * BLOCK.split, y);
    path.lineTo(x + width * BLOCK.split, y + row * rows.length);
  });
  rows.forEach((text, index) => {
    const [label, ...rest] = text.split("|").map(part => part.trim());
    const middle = y + index * row + row / 2;
    const value = rest.join(" | ");
    write(pen, value ? label : "", [x + unit * 0.015, middle], { size: unit * BLOCK.label, color: options.colors.muted, track: unit * 0.003, align: "left" });
    write(pen, value || label, [x + width * BLOCK.split + unit * 0.015, middle], { size: unit * BLOCK.value, color: options.colors.line, align: "left" });
  });
}

function notes(pen: Pen) {
  const { options, unit } = pen;
  options.notes.filter(Boolean).forEach((text, index) => {
    write(pen, `${index + 1}. ${text}`, [options.width * NOTES.x, unit * (NOTES.y + index * NOTES.gap)], { size: unit * NOTES.size, color: options.colors.muted, align: "left", track: unit * 0.002 });
  });
}

// Stamp: a turned double frame with the text in brick red
function stamp(pen: Pen) {
  const { context, options, unit } = pen;
  if (!options.stamp) return;
  const size = unit * STAMP.size;
  context.save();
  context.translate(options.width * STAMP.x, unit * STAMP.y);
  context.rotate(STAMP.angle);
  context.font = `700 ${size}px "${options.font}"`;
  context.letterSpacing = `${size * 0.15}px`;
  const wide = context.measureText(options.stamp).width + unit * STAMP.pad * 2;
  const high = size + unit * STAMP.pad * 2;
  const gap = LINE.thick * 1.5;
  stroke(pen, options.colors.brick, LINE.thick, path => {
    path.rect(-wide / 2, -high / 2, wide, high);
    path.rect(-wide / 2 + gap, -high / 2 + gap, wide - 2 * gap, high - 2 * gap);
  });
  write(pen, options.stamp, [0, 0], { size, color: options.colors.brick, track: size * 0.15 });
  context.restore();
}

export function drawSheet(context: CanvasRenderingContext2D, options: SheetOptions) {
  const pen: Pen = { context, options, unit: options.height };
  context.fillStyle = options.colors.blueprint;
  context.fillRect(0, 0, options.width, options.height);
  grid(pen);
  border(pen);
  write(pen, options.title, [options.width / 2, pen.unit * TITLE.y], { size: pen.unit * TITLE.size, color: options.colors.accent, track: pen.unit * TITLE.track });
  write(pen, options.subtitle, [options.width / 2, pen.unit * TITLE.subY], { size: pen.unit * TITLE.subSize, color: options.colors.copper, track: pen.unit * TITLE.subTrack });
  house(pen);
  notes(pen);
  block(pen);
  stamp(pen);
}
