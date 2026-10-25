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
import { glyphAt, headAt, LAYER_COUNT, mix, type RainColumn, rainColumns, rainLookOf } from "../rain.ts";
import type { MatrixValues } from "../settings.ts";
import { useMatrix } from "../useMatrix.ts";
import { glyphAtlas, useGlyphFont } from "./GlyphAtlas.ts";

export type RainControl = { tempo: (seconds: number) => number; jitter: number; drain: number | null };

// area: own size in px (inside the alert box) instead of the stage
type Props = { opacity: number; control?: { current: RainControl }; area?: { width: number; height: number } };

const SECOND_MS = 1000; // fixed: seconds in ms
const SEEK = seekFromQuery(location.search);
const LOW = "niedrig"; // fixed: the low performance level of quality.ts

type Column = RainColumn & { size: number; layer: number; cells: Sprite[]; head: Sprite };

// The sprites of every column: trail cells on a plane per layer (blurred far away), heads on one additive glowing plane
function columnsOf(app: Application, values: MatrixValues, atlas: Texture[], width: number): Column[] {
  const low = values.quality === LOW;
  const sizes = [values.rainSizeFar, values.rainSizeMid, values.rainSizeNear];
  const density = (values.rainDensity / 100) * quality(values.quality).particles;
  const heads = new Container();
  heads.blendMode = "add";
  if (!low && values.headGlow > 0) heads.filters = [new BlurFilter({ strength: values.headGlow, quality: 3 })];
  const columns: Column[] = [];
  const look = rainLookOf(values);
  const first = LAYER_COUNT - Math.max(1, Math.min(LAYER_COUNT, values.rainLayers));
  for (let layer = first; layer < LAYER_COUNT; layer++) {
    const size = sizes[layer];
    const plane = new Container();
    const blur = [values.rainBlurFar, values.rainBlurFar * values.rainMidBlur, 0][layer];
    if (!low && blur > 0) plane.filters = [new BlurFilter({ strength: blur, quality: 2 })];
    app.stage.addChild(plane);
    for (const column of rainColumns(layer, size, { seed: values.rainSeed, width, density, look })) {
      const cells = Array.from({ length: column.trail }, () => {
        const sprite = new Sprite(atlas[0]);
        sprite.anchor.set(0.5);
        sprite.width = sprite.height = size * values.rainGlyphScale;
        plane.addChild(sprite);
        return sprite;
      });
      const head = new Sprite(atlas[0]);
      head.anchor.set(0.5);
      head.width = head.height = size * values.rainHeadScale;
      head.tint = hexNumber(values.rainHeadColor);
      heads.addChild(head);
      columns.push({ ...column, size, layer, cells, head });
    }
  }
  app.stage.addChild(heads);
  return columns;
}

function build(app: Application, values: MatrixValues, control: { current: RainControl } | undefined, area: { width: number; height: number }) {
  const atlas: Texture[] = glyphAtlas(values.glyphs, values.font);
  const columns = columnsOf(app, values, atlas, area.width);
  const tints = [hexNumber(values.rainFarColor), hexNumber(mixHex(values.rainFarColor, values.rainNearColor, values.rainMidMix)), hexNumber(values.rainNearColor)];
  const flash = hexNumber(values.rainHeadColor);
  const started = performance.now();
  const change = { tip: values.glyphChangeTip, trail: values.glyphChange, tipCells: values.rainTip };
  const alphas = rainLookOf(values).layers.map(layer => layer.alpha);
  const paint = () => {
    const seconds = SEEK ?? (performance.now() - started) / SECOND_MS;
    const rainSeconds = (control?.current.tempo ?? (time => time * values.rainSpeed))(seconds);
    const jitter = control?.current.jitter ?? 0;
    for (const column of columns) {
      const at = headAt(column, column.size, area.height, rainSeconds);
      const drain = control?.current.drain ?? null;
      const drained = at !== null && drain !== null && at.run > (headAt(column, column.size, area.height, drain)?.run ?? -1);
      column.head.visible = at !== null && !drained;
      if (!at || drained) {
        for (const cell of column.cells) cell.visible = false;
        continue;
      }
      const alpha = alphas[column.layer];
      column.cells.forEach((cell, behind) => {
        const row = at.row - behind;
        const y = row * column.size + column.size / 2;
        cell.visible = y > -column.size && y < area.height + column.size;
        if (!cell.visible) return;
        cell.texture = atlas[glyphAt(values.rainSeed + at.run, column, row, behind, seconds, atlas.length, change)];
        const shake = jitter > 0 && mix(row, column.key) < values.rainShaken ? (mix(row, Math.floor(seconds * 30)) - 0.5) * values.rainShake * jitter : 0;
        cell.position.set(column.x + shake, y);
        cell.alpha = (1 - behind / column.trail) ** values.rainFade * alpha;
        cell.tint = behind === 0 ? flash : tints[column.layer];
      });
      column.head.position.set(column.x, at.row * column.size + column.size / 2);
      column.head.texture = column.cells[0].texture;
      column.head.alpha = values.rainHeadAlpha * alpha;
    }
  };
  paint();
  app.ticker.add(paint);
  return () => app.ticker.remove(paint);
}

export default function Rain({ opacity, control, area }: Props) {
  const values = useMatrix();
  const latest = useRef(values);
  latest.current = values;
  const font = useGlyphFont();
  if (!font) return null;
  // A new stage when a setting of the rain changes (the build reads them once)
  const key = [values.glyphs, values.font, values.quality, values.rainSeed, values.rainLayers, values.rainSizeFar, values.rainSizeMid, values.rainSizeNear,
    values.rainDensity, values.rainSpeed, values.rainBlurFar, values.headGlow, values.glyphChange, values.glyphChangeTip, JSON.stringify(rainLookOf(values)),
    values.rainGlyphScale, values.rainHeadScale, values.rainHeadAlpha, values.rainFade, values.rainShake, values.rainShaken, values.rainMidBlur, values.rainTip,
    values.rainHeadColor, values.rainFarColor, values.rainNearColor, values.rainMidMix].join("|");
  return (
    <div className="rain" style={{ opacity }} aria-hidden="true">
      <PixiStage key={key} background={null} size={area} onReady={app => build(app, latest.current, control, area ?? STAGE)} />
    </div>
  );
}
