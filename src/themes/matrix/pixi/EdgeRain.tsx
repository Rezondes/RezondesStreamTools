// Fine code rain along the left and the right edge of the Matrix camera frame (PLAN-MATRIX.md package 3): one rain
// layer of rain.ts per edge strip in small glyphs, the heads bright, the trails fading, every glyph fainter towards the
// inside of the frame, so the picture stays free. Drawn every frame from the clock, behind the corners and the label.
import { type Application, Container, Sprite } from "pixi.js";
import { useRef } from "react";
import { hexNumber } from "../../../core/color.ts";
import { seekFromQuery } from "../../../core/motion/seek.ts";
import PixiStage from "../../../core/pixi/PixiStage.tsx";
import { glyphAt, headAt, type RainColumn, rainColumns } from "../rain.ts";
import type { MatrixValues } from "../settings.ts";
import { useMatrix } from "../useMatrix.ts";
import { glyphAtlas, useGlyphFont } from "./GlyphAtlas.ts";

type Area = { width: number; height: number };
type Column = RainColumn & { cells: Sprite[]; edge: number };

const SECOND_MS = 1000; // fixed: seconds in ms
const SEEK = seekFromQuery(location.search);
// fixed: the middle layer of rain.ts, glyph size over the cell, how the trail fades, how much fainter the innermost
// column is than the outermost
const LOOK = { layer: 1, glyph: 1.05, fade: 1.6, inward: 0.6 };

function build(app: Application, values: MatrixValues, area: Area) {
  const atlas = glyphAtlas(values.glyphs, values.font);
  const size = values.camRainSize;
  const strip = Math.min(values.camRainWidth, area.width / 2);
  const plane = new Container();
  app.stage.addChild(plane);
  // The right strip gets another seed, so the edges do not mirror each other; edge is the distance to the outer edge
  const columns: Column[] = [0, 1].flatMap(side => rainColumns(LOOK.layer, size, { seed: values.rainSeed + side, width: strip, density: 1 }).map(column => ({
    ...column,
    x: side === 0 ? column.x : area.width - column.x,
    edge: column.x,
    cells: Array.from({ length: column.trail }, () => {
      const sprite = new Sprite(atlas[0]);
      sprite.anchor.set(0.5);
      sprite.width = sprite.height = size * LOOK.glyph;
      plane.addChild(sprite);
      return sprite;
    }),
  })));
  const [tint, head] = [hexNumber(values.accent), hexNumber(values.flash)];
  const change = { tip: values.glyphChangeTip, trail: values.glyphChange };
  const started = performance.now();
  const paint = () => {
    const seconds = SEEK ?? (performance.now() - started) / SECOND_MS;
    for (const column of columns) {
      const at = headAt(column, size, area.height, seconds * values.rainSpeed);
      const inward = 1 - (LOOK.inward * column.edge) / strip;
      column.cells.forEach((cell, behind) => {
        const row = (at?.row ?? 0) - behind;
        const y = row * size + size / 2;
        cell.visible = at !== null && y > -size && y < area.height + size;
        if (!at || !cell.visible) return;
        cell.texture = atlas[glyphAt(values.rainSeed + at.run, column, row, behind, seconds, atlas.length, change)];
        cell.position.set(column.x, y);
        cell.alpha = (1 - behind / column.trail) ** LOOK.fade * inward;
        cell.tint = behind === 0 ? head : tint;
      });
    }
  };
  paint();
  app.ticker.add(paint);
  return () => app.ticker.remove(paint);
}

export default function EdgeRain({ area }: { area: Area }) {
  const values = useMatrix();
  const latest = useRef(values);
  latest.current = values;
  const font = useGlyphFont();
  if (!font) return null;
  // A new stage when a setting of the rain changes (the build reads them once)
  const key = [values.glyphs, values.font, values.rainSeed, values.rainSpeed, values.camRainSize, values.camRainWidth, values.glyphChange, values.glyphChangeTip, values.accent, values.flash].join("|");
  return <PixiStage key={key} className="cam-rain" background={null} size={area} onReady={app => build(app, latest.current, area)} />;
}
