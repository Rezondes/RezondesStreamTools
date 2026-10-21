// The mango picker in the PixiJS world (picker.ts): stands in the near tree row on the side of the settings, moves with
// its share of the camera swing and reaches up into the tree with the pole (Starting), every frame from the clock.
import { type Application, Container, Graphics } from "pixi.js";
import { useEffect } from "react";
import { armAt, picker } from "../picker.ts";
import type { PlantageValues } from "../settings.ts";
import { cameraAt } from "../world.ts";
import { drawShapes, NEAR_MOVE, NEAR_Z } from "./WorldLayer.tsx";

type Props = { app: Application; world: Container; clock: () => number; values: PlantageValues; reachAt: number };

// fixed: where the picker stands (feet) on the left and on the right, and how long the reach takes in s
const SPOT = { left: 470, right: 1450, ground: 990 };
const REACH_SECONDS = 1.2;

export default function Picker({ app, world, clock, values, reachAt }: Props) {
  useEffect(() => {
    const parts = picker({
      hat: values.pickerHat, band: values.accent, shirt: values.pickerShirt, skin: values.pickerSkin, pants: values.woodDark,
      eye: values.textOnWood, pole: values.wood, basket: values.wood, shadow: values.textOnWood,
    });
    const figure = new Container();
    const arm = drawShapes(new Graphics(), parts.arm);
    arm.position.set(parts.shoulder.x, parts.shoulder.y);
    const basket = drawShapes(new Graphics(), parts.basket);
    basket.position.set(parts.basketAt.x, parts.basketAt.y);
    figure.addChild(arm, drawShapes(new Graphics(), parts.body), basket);
    const left = values.pickerSide !== "rechts";
    const home = left ? SPOT.left : SPOT.right;
    figure.scale.set(left ? values.pickerSize : -values.pickerSize, values.pickerSize);
    figure.zIndex = NEAR_Z;
    world.addChild(figure);
    const place = () => {
      const seconds = clock();
      figure.position.set(home - cameraAt(seconds, values.parallaxSeconds, values.parallaxOn) * values.parallaxAmount * NEAR_MOVE, SPOT.ground);
      arm.rotation = armAt(seconds, reachAt, REACH_SECONDS, values.pickerReach);
    };
    place();
    app.ticker.add(place);
    return () => {
      app.ticker.remove(place);
      world.removeChild(figure);
      figure.destroy({ children: true });
    };
  }, [app, world, clock, values, reachAt]);
  return null;
}
