// The code rain of the Matrix theme in PixiJS (PLAN-MATRIX.md package 1, refs/starting.html): up to three depth layers
// of tinted glyph sprites from the atlas (far small, dim and blurred; near big, bright and fast), the heads almost white
// with a glow on an additive layer, the trails fading; positions and glyphs from rain.ts. tempo turns the clock into
// the rain time (BRB slows the rain), jitter > 0 shakes rows sideways during a glitch, after drain (rain time) no
// column starts a new run, so the rain falls out of the picture (Ending). The low performance level drops
// the blur and thins the columns.
import { type Application, BlurFilter, Container, Sprite, type Texture } from "pixi.js";
import { useRef } from "react";
import { hexNumber, mixHex } from "../../../core/color.ts";
import { seekFromQuery } from "../../../core/motion/seek.ts";
import PixiStage from "../../../core/pixi/PixiStage.tsx";
import { STAGE } from "../../../core/screens/screens.ts";
import { quality } from "../../../core/three/quality.ts";
import { glyphAt, headAt, LAYERS, mix, type RainColumn, rainColumns } from "../rain.ts";
import type { MatrixValues } from "../settings.ts";
import { useMatrix } from "../useMatrix.ts";
import { glyphAtlas } from "./GlyphAtlas.ts";

export type RainControl = { tempo: (seconds: number) => number; jitter: number; drain: number | null };

type Props = { opacity: number; control?: { current: RainControl } };

const SECOND_MS = 1000; // fixed: seconds in ms
const SEEK = seekFromQuery(location.search);
const LOW = "niedrig"; // fixed: the low performance level of quality.ts
// fixed: glyph size over the cell, head size over the cell, head alpha, how the trail fades, glitch shake (px), share
// of shaken rows, the share of the blur of the far layer the middle one gets
const LOOK = { glyph: 1.05, head: 1.6, headAlpha: 0.55, fade: 1.6, shake: 40, shaken: 0.3, midBlur: 0.33 };

type Column = RainColumn & { size: number; layer: number; cells: Sprite[]; head: Sprite };

// The sprites of every column: trail cells on a plane per layer (blurred far away), heads on one additive glowing plane
function columnsOf(app: Application, values: MatrixValues, atlas: Texture[]): Column[] {
  const low = values.quality === LOW;
  const sizes = [values.rainSizeFar, values.rainSizeMid, values.rainSizeNear];
  const density = (values.rainDensity / 100) * quality(values.quality).particles;
  const heads = new Container();
  heads.blendMode = "add";
  if (!low && values.headGlow > 0) heads.filters = [new BlurFilter({ strength: values.headGlow, quality: 3 })];
  const columns: Column[] = [];
  const first = LAYERS.length - Math.max(1, Math.min(LAYERS.length, values.rainLayers));
  for (let layer = first; layer < LAYERS.length; layer++) {
    const size = sizes[layer];
    const plane = new Container();
    const blur = [values.rainBlurFar, values.rainBlurFar * LOOK.midBlur, 0][layer];
    if (!low && blur > 0) plane.filters = [new BlurFilter({ strength: blur, quality: 2 })];
    app.stage.addChild(plane);
    for (const column of rainColumns(layer, size, { seed: values.rainSeed, width: STAGE.width, density })) {
      const cells = Array.from({ length: column.trail }, () => {
        const sprite = new Sprite(atlas[0]);
        sprite.anchor.set(0.5);
        sprite.width = sprite.height = size * LOOK.glyph;
        plane.addChild(sprite);
        return sprite;
      });
      const head = new Sprite(atlas[0]);
      head.anchor.set(0.5);
      head.width = head.height = size * LOOK.head;
      head.tint = hexNumber(values.flash);
      heads.addChild(head);
      columns.push({ ...column, size, layer, cells, head });
    }
  }
  app.stage.addChild(heads);
  return columns;
}

function build(app: Application, values: MatrixValues, control: { current: RainControl } | undefined) {
  const atlas: Texture[] = glyphAtlas(values.glyphs, values.font);
  const columns = columnsOf(app, values, atlas);
  const tints = [hexNumber(values.dim), hexNumber(mixHex(values.dim, values.accent, 0.5)), hexNumber(values.accent)];
  const flash = hexNumber(values.flash);
  const started = performance.now();
  const change = { tip: values.glyphChangeTip, trail: values.glyphChange };
  const paint = () => {
    const seconds = SEEK ?? (performance.now() - started) / SECOND_MS;
    const rainSeconds = (control?.current.tempo ?? (time => time * values.rainSpeed))(seconds);
    const jitter = control?.current.jitter ?? 0;
    for (const column of columns) {
      const at = headAt(column, column.size, STAGE.height, rainSeconds);
      const drain = control?.current.drain ?? null;
      const drained = at !== null && drain !== null && at.run > (headAt(column, column.size, STAGE.height, drain)?.run ?? -1);
      column.head.visible = at !== null && !drained;
      if (!at || drained) {
        for (const cell of column.cells) cell.visible = false;
        continue;
      }
      const alpha = LAYERS[column.layer].alpha;
      column.cells.forEach((cell, behind) => {
        const row = at.row - behind;
        const y = row * column.size + column.size / 2;
        cell.visible = y > -column.size && y < STAGE.height + column.size;
        if (!cell.visible) return;
        cell.texture = atlas[glyphAt(values.rainSeed + at.run, column, row, behind, seconds, atlas.length, change)];
        const shake = jitter > 0 && mix(row, column.key) < LOOK.shaken ? (mix(row, Math.floor(seconds * 30)) - 0.5) * LOOK.shake * jitter : 0;
        cell.position.set(column.x + shake, y);
        cell.alpha = (1 - behind / column.trail) ** LOOK.fade * alpha;
        cell.tint = behind === 0 ? flash : tints[column.layer];
      });
      column.head.position.set(column.x, at.row * column.size + column.size / 2);
      column.head.texture = column.cells[0].texture;
      column.head.alpha = LOOK.headAlpha * alpha;
    }
  };
  paint();
  app.ticker.add(paint);
  return () => app.ticker.remove(paint);
}

export default function Rain({ opacity, control }: Props) {
  const values = useMatrix();
  const latest = useRef(values);
  latest.current = values;
  // A new stage when a setting of the rain changes (the build reads them once)
  const key = [values.glyphs, values.font, values.quality, values.rainSeed, values.rainLayers, values.rainSizeFar, values.rainSizeMid, values.rainSizeNear,
    values.rainDensity, values.rainSpeed, values.rainBlurFar, values.headGlow, values.glyphChange, values.glyphChangeTip, values.dim, values.accent, values.flash].join("|");
  return (
    <div className="rain" style={{ opacity }} aria-hidden="true">
      <PixiStage key={key} background={null} onReady={app => build(app, latest.current, control)} />
    </div>
  );
}
