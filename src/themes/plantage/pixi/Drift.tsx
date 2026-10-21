// Falling leaves and glittering light motes over the PixiJS world (drift.ts), on top of everything else and fading in
// with the sunrise (Starting); at the Ending fireflies light up as the sunset goes on. Positions every frame from the
// clock alone; their number follows the performance level.
import { type Application, Container, Graphics } from "pixi.js";
import { useEffect } from "react";
import { particleCount, quality } from "../../../core/three/quality.ts";
import { fireflyAt, leafAt, moteAt } from "../drift.ts";
import type { PlantageValues } from "../settings.ts";
import { cameraAt, daylight, type LightKind } from "../world.ts";

type Props = { app: Application; clock: () => number; values: PlantageValues; kind: LightKind };

// fixed: leaves are a little nearer than the front layer, so they move a bit more than the camera swing
const LEAF_MOVE = 1.15;
const LEAF = { length: 18, width: 8, rib: 2 };

const countOf = (on: boolean, wanted: number, level: string) => (on && wanted > 0 ? particleCount(wanted, level) : 0);

export default function Drift({ app, clock, values, kind }: Props) {
  useEffect(() => {
    const box = new Container();
    const leaves = Array.from({ length: countOf(values.leavesOn, values.worldLeafCount, values.quality) }, (_, index) => {
      const color = leafAt(values.worldSeed, index, 0).color ? values.accent2 : values.leaf;
      const leaf = new Graphics().ellipse(0, 0, LEAF.length, LEAF.width).fill(color).rect(-LEAF.length, -LEAF.rib / 2, LEAF.length * 2, LEAF.rib).fill({ color: values.leafDark, alpha: 0.6 });
      box.addChild(leaf);
      return leaf;
    });
    const motes = new Graphics();
    if (quality(values.quality).bloom) motes.blendMode = "add";
    box.addChild(motes);
    const moteTotal = countOf(values.motesOn, values.moteCount, values.quality);
    const flyTotal = kind === "ending" ? countOf(values.firefliesOn, values.fireflyCount, values.quality) : 0;
    app.stage.addChild(box);
    const place = () => {
      const seconds = clock();
      const light = daylight(kind, seconds, values);
      // Leaves and motes fade in with the sunrise; fireflies light up with the dusk
      const shown = kind === "starting" ? light.sky : 1;
      const shift = cameraAt(seconds, values.parallaxSeconds, values.parallaxOn) * values.parallaxAmount * LEAF_MOVE;
      leaves.forEach((leaf, index) => {
        const spot = leafAt(values.worldSeed, index, seconds);
        leaf.position.set(spot.x - shift, spot.y);
        leaf.rotation = spot.rotation;
        leaf.alpha = shown;
      });
      motes.clear();
      for (let index = 0; index < moteTotal; index++) {
        const mote = moteAt(values.worldSeed, index, seconds);
        motes.circle(mote.x, mote.y, mote.size).fill({ color: values.paper, alpha: mote.alpha * shown });
      }
      for (let index = 0; index < flyTotal; index++) {
        const fly = fireflyAt(values.worldSeed, index, seconds);
        motes.circle(fly.x - shift, fly.y, fly.size).fill({ color: values.sun, alpha: fly.alpha * light.sky });
      }
    };
    place();
    app.ticker.add(place);
    return () => {
      app.ticker.remove(place);
      app.stage.removeChild(box);
      box.destroy({ children: true });
    };
  }, [app, clock, values, kind]);
  return null;
}
