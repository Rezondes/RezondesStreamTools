// The brush strokes of a Chaos screen in PixiJS (brush.ts): every stroke of the scene's composition is painted one after
// the other, sharp and once more blurred with additive blending as its neon glow; drips run down once the brush has
// passed and, after the build, keep dropping; the bristles shimmer. Every frame from the clock.
import { type Application, BlurFilter, Container, Graphics } from "pixi.js";
import { useEffect } from "react";
import { quality } from "../../../core/three/quality.ts";
import { brushAt, brushPoint, brushSchedule, type makeBrush } from "../brush.ts";
import { dripAt } from "../idle.ts";
import type { ChaosValues } from "../settings.ts";
import type { GestureKind } from "../strokes.ts";

type Props = { app: Application; world: Container; clock: () => number; values: ChaosValues; gesture: GestureKind; mainColor: string; seed: number; idleFrom: number };

// fixed: paint body and glow strengths
const BODY = { sharp: 0.42, glow: 0.35 };
const GLOW_BRISTLE = { width: 2, alpha: 0.5 };
const DROP = { width: 0.9, stretch: [0.7, 1.1] };
export const BRUSH_Z = 20;

type Painted = { brush: ReturnType<typeof makeBrush>; color: string; drips: Graphics };

// The drips of a stroke: they run down once the brush has passed them, looping they drop off
function paintDrips(stroke: Painted, since: number, progress: number, strokeSeconds: number, loop: boolean) {
  for (const drip of stroke.brush.drips) {
    if (progress < drip.at) continue;
    const state = dripAt(drip, since - strokeSeconds * drip.at, loop);
    const top = brushPoint(stroke.brush, drip.at, drip.offset);
    stroke.drips.moveTo(top.x, top.y).lineTo(top.x, top.y + state.run).stroke({ width: drip.width, color: stroke.color, cap: "round" });
    stroke.drips.circle(top.x, top.y + state.run, drip.width * DROP.width).fill(stroke.color);
    if (state.drop && state.drop.size > 0) {
      stroke.drips.ellipse(top.x, top.y + drip.length + state.drop.offset, drip.width * DROP.stretch[0] * state.drop.size, drip.width * DROP.stretch[1] * state.drop.size).fill({ color: stroke.color, alpha: state.drop.alpha });
    }
  }
}

export default function Brushes({ app, world, clock, values, gesture, mainColor, seed, idleFrom }: Props) {
  useEffect(() => {
    const colorOf = (color: string) => (color === "cyan" || (color === "main" && mainColor === "cyan") ? values.accent2 : values.accent);
    const strokes = brushSchedule(gesture, seed).map(entry => ({ ...entry, color: colorOf(entry.color), sharp: new Graphics(), soft: new Graphics(), drips: new Graphics() }));
    const sharp = new Container();
    const glow = new Container();
    if (quality(values.quality).bloom) glow.filters = [new BlurFilter({ strength: values.glowStrength, quality: 4 })];
    glow.blendMode = "add";
    glow.alpha = values.glowAlpha;
    for (const stroke of strokes) {
      sharp.addChild(stroke.sharp, stroke.drips);
      glow.addChild(stroke.soft);
    }
    const layer = new Container();
    layer.addChild(glow, sharp);
    layer.zIndex = BRUSH_Z;
    world.addChild(layer);
    const strokeSeconds = values.strokeMs / 1000;
    const place = () => {
      const seconds = clock();
      const idle = values.idleOn && seconds >= idleFrom;
      for (const stroke of strokes) {
        const progress = (seconds - stroke.start) / strokeSeconds;
        const frame = brushAt(stroke.brush, progress, seconds, idle ? values.bristleShimmer : 0);
        stroke.sharp.clear();
        stroke.soft.clear();
        stroke.drips.clear();
        if (frame.body) {
          stroke.sharp.poly(frame.body).fill({ color: stroke.color, alpha: BODY.sharp });
          stroke.soft.poly(frame.body).fill({ color: stroke.color, alpha: BODY.glow });
        }
        for (const bristle of frame.bristles) {
          stroke.sharp.poly(bristle.points, false).stroke({ width: bristle.width, color: bristle.light ? values.textColor : stroke.color, alpha: bristle.alpha, cap: "round" });
          stroke.soft.poly(bristle.points, false).stroke({ width: bristle.width * GLOW_BRISTLE.width, color: stroke.color, alpha: GLOW_BRISTLE.alpha });
        }
        if (values.drips) paintDrips(stroke, seconds - stroke.start, progress, strokeSeconds, idle && values.dripLoop);
      }
    };
    place();
    app.ticker.add(place);
    return () => {
      app.ticker.remove(place);
      world.removeChild(layer);
      layer.destroy({ children: true });
    };
  }, [app, world, clock, values, gesture, mainColor, seed, idleFrom]);
  return null;
}
