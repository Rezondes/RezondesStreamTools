// Light dust of the standard screens (moteAt in aurora.ts): small soft dots between the two accents rise slowly, sway
// and glow up one by one; added on top of each other, fading in with the light fields. Their number follows the
// performance level; positions every frame from the clock alone.
import { type Application, Container, Sprite } from "pixi.js";
import { useEffect } from "react";
import { particleCount } from "../../../core/three/quality.ts";
import { auroraOptions, introShare, moteAt } from "../aurora.ts";
import type { StandardValues } from "../settings.ts";
import { softDot } from "./softDot.ts";

type Props = { app: Application; clock: () => number; values: StandardValues };

// fixed: texture size in px and share of the bright core, like the prototype (refs/starting.html)
const TEXTURE = { size: 32, core: 0.25 };

export default function Dust({ app, clock, values }: Props) {
  useEffect(() => {
    const total = values.dustOn && values.dustCount > 0 ? particleCount(values.dustCount, values.quality) : 0;
    const texture = softDot(TEXTURE.size, TEXTURE.core);
    const box = new Container();
    box.blendMode = "add";
    const options = auroraOptions(values);
    const sprites = Array.from({ length: total }, (_, index) => {
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      sprite.tint = moteAt(options, index, 0).color;
      box.addChild(sprite);
      return sprite;
    });
    app.stage.addChild(box);
    const place = () => {
      const seconds = clock();
      const shown = introShare(seconds, values.introMs);
      sprites.forEach((sprite, index) => {
        const mote = moteAt(options, index, seconds);
        sprite.position.set(mote.x, mote.y);
        sprite.width = sprite.height = mote.size;
        sprite.alpha = mote.alpha * shown;
      });
    };
    place();
    app.ticker.add(place);
    return () => {
      app.ticker.remove(place);
      app.stage.removeChild(box);
      box.destroy({ children: true });
      texture.destroy(true);
    };
  }, [app, clock, values]);
  return null;
}
