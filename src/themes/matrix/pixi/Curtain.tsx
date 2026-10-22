// The rain curtain and the dissolve of the Matrix alert in PixiJS (PLAN-MATRIX.md package 3): glyph sprites of the
// atlas over the box, the curtain pouring down at the start (curtainAt), the box falling apart at leaveAt (dissolveAt);
// below the box there is room for the falling glyphs. Drawn every frame from the clock of the alert.
import { type Application, Container, Sprite } from "pixi.js";
import { useRef } from "react";
import { hexNumber } from "../../../core/color.ts";
import PixiStage from "../../../core/pixi/PixiStage.tsx";
import { type Area, curtainAt, dissolveAt, type Glyph } from "../curtain.ts";
import { mix } from "../rain.ts";
import type { MatrixValues } from "../settings.ts";
import { useMatrix } from "../useMatrix.ts";
import { glyphAtlas, useGlyphFont } from "./GlyphAtlas.ts";

export type CurtainClock = { time: number; leaveAt: number };

// fixed: room below the box for the falling glyphs (px), glyph size over the cell, how often a glyph changes (per s)
const FALL_ROOM = 420;
const GLYPH = 1.05;
const CHANGE = 10;
const SECOND_MS = 1000; // fixed: seconds in ms

function build(app: Application, values: MatrixValues, area: Area, clock: CurtainClock) {
  const atlas = glyphAtlas(values.glyphs, values.font);
  const layer = new Container();
  app.stage.addChild(layer);
  const pool: Sprite[] = [];
  const [tint, head] = [hexNumber(values.accent), hexNumber(values.flash)];
  const cell = values.alertCurtainSize;
  const paint = () => {
    const glyphs: Glyph[] = [
      ...(values.alertCurtainOn ? curtainAt(area, cell, clock.time, values.alertCurtainSpeed, values.rainSeed) : []),
      ...(values.alertDissolveOn ? dissolveAt(area, cell, clock.time - clock.leaveAt, values.alertDissolveMs / SECOND_MS, values.rainSeed) : []),
    ];
    while (pool.length < glyphs.length) {
      const sprite = new Sprite(atlas[0]);
      sprite.anchor.set(0.5);
      sprite.width = sprite.height = cell * GLYPH;
      layer.addChild(sprite);
      pool.push(sprite);
    }
    pool.forEach((sprite, index) => {
      const glyph = glyphs[index];
      sprite.visible = glyph !== undefined;
      if (!glyph) return;
      sprite.position.set(glyph.x, glyph.y);
      sprite.alpha = glyph.alpha;
      sprite.tint = glyph.head ? head : tint;
      sprite.texture = atlas[Math.floor(mix(values.rainSeed, glyph.key, Math.floor(clock.time * CHANGE)) * atlas.length)];
    });
  };
  paint();
  app.ticker.add(paint);
  return () => app.ticker.remove(paint);
}

export default function Curtain({ area, clock }: { area: Area; clock: CurtainClock }) {
  const values = useMatrix();
  const latest = useRef(values);
  latest.current = values;
  const font = useGlyphFont();
  if (!font) return null;
  return (
    <div className="alert-curtain" aria-hidden="true">
      <PixiStage background={null} size={{ width: Math.round(area.width), height: Math.round(area.height) + FALL_ROOM }} onReady={app => build(app, latest.current, area, clock)} />
    </div>
  );
}
