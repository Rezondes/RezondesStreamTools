// The mango picker in the PixiJS world (picker.ts): stands in the near tree row on the side of the settings and moves
// with its share of the camera swing. Starting: reaches up into the tree with the pole; BRB: picks a mango again and
// again, it falls with a bounce into the basket; Ending: waves with the pole and a full basket. Every frame from the clock.
import { type Application, Container, Graphics } from "pixi.js";
import { useEffect } from "react";
import { armAt, pickAt, picker, waveAt } from "../picker.ts";
import type { PlantageValues } from "../settings.ts";
import { mango } from "../tree.ts";
import { cameraAt, type LightKind } from "../world.ts";
import { drawShapes, NEAR_MOVE, NEAR_Z } from "./WorldLayer.tsx";

type Props = { app: Application; world: Container; clock: () => number; values: PlantageValues; kind: LightKind; reachAt: number };

// fixed: where the picker stands (feet) on the left and on the right, how long the reach takes in s, mango size and the
// mangos of the full basket (Ending) relative to the basket
const SPOT = { left: 470, right: 1450, ground: 990 };
const REACH_SECONDS = 1.2;
const MANGO = 16;
const FULL: readonly [number, number][] = [[-26, -50], [0, -56], [26, -50], [-13, -64], [13, -64]];

export default function Picker({ app, world, clock, values, kind, reachAt }: Props) {
  useEffect(() => {
    const parts = picker({
      hat: values.pickerHat, band: values.accent, shirt: values.pickerShirt, skin: values.pickerSkin, pants: values.woodDark,
      eye: values.textOnWood, pole: values.wood, basket: values.wood, shadow: values.textOnWood,
    });
    const colors = { mango: values.mango, mangoBlush: values.mangoBlush, gloss: values.paper };
    const figure = new Container();
    const arm = drawShapes(new Graphics(), parts.arm);
    arm.position.set(parts.shoulder.x, parts.shoulder.y);
    const basket = drawShapes(new Graphics(), parts.basket);
    basket.position.set(parts.basketAt.x, parts.basketAt.y);
    if (kind === "ending") drawShapes(basket, FULL.flatMap(([x, y]) => mango(x, y, MANGO, colors)));
    const picked = drawShapes(new Graphics(), mango(0, 0, MANGO, colors));
    picked.visible = false;
    figure.addChild(arm, drawShapes(new Graphics(), parts.body), basket, picked);
    const left = values.pickerSide !== "rechts";
    const home = left ? SPOT.left : SPOT.right;
    figure.scale.set(left ? values.pickerSize : -values.pickerSize, values.pickerSize);
    figure.zIndex = NEAR_Z;
    world.addChild(figure);
    const place = () => {
      const seconds = clock();
      figure.position.set(home - cameraAt(seconds, values.parallaxSeconds, values.parallaxOn) * values.parallaxAmount * NEAR_MOVE, SPOT.ground);
      if (kind === "brb") {
        const pick = pickAt(seconds, values.brbPickEvery, parts, values.brbMangoBounce);
        arm.rotation = pick.arm;
        picked.visible = pick.mango !== null;
        if (pick.mango) picked.position.set(pick.mango.x, pick.mango.y);
      } else {
        arm.rotation = kind === "ending" ? waveAt(seconds) : armAt(seconds, reachAt, REACH_SECONDS, values.pickerReach);
      }
    };
    place();
    app.ticker.add(place);
    return () => {
      app.ticker.remove(place);
      world.removeChild(figure);
      figure.destroy({ children: true });
    };
  }, [app, world, clock, values, kind, reachAt]);
  return null;
}
