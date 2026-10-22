// Light fields of the standard screens (aurora.ts): large soft sprites in both accents on closed orbits, added on top
// of each other and blurred unless the performance level is low; they fade in over introMs. Positions every frame
// from the clock alone, so ?t= stills match.
import { type Application, BlurFilter, Container, Sprite } from "pixi.js";
import { useEffect } from "react";
import { quality } from "../../../core/three/quality.ts";
import { auroraField, auroraOptions, introShare } from "../aurora.ts";
import type { StandardValues } from "../settings.ts";
import { softDot } from "./softDot.ts";

type Props = { app: Application; clock: () => number; values: StandardValues };

// fixed: texture size in px and share of the bright core, like the prototype (refs/starting.html)
const TEXTURE = { size: 512, core: 0.35 };
// fixed: passes of the blur, like the prototype
const BLUR_QUALITY = 4;

export default function Aurora({ app, clock, values }: Props) {
  useEffect(() => {
    const texture = softDot(TEXTURE.size, TEXTURE.core);
    const box = new Container();
    box.blendMode = "add";
    if (quality(values.quality).bloom && values.auroraBlur > 0) box.filters = [new BlurFilter({ strength: values.auroraBlur, quality: BLUR_QUALITY })];
    const options = auroraOptions(values);
    const sprites = Array.from({ length: values.auroraFields }, () => {
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      box.addChild(sprite);
      return sprite;
    });
    app.stage.addChild(box);
    const place = () => {
      const seconds = clock();
      const shown = introShare(seconds, values.introMs);
      sprites.forEach((sprite, index) => {
        const field = auroraField(options, index, seconds);
        sprite.position.set(field.x, field.y);
        sprite.width = sprite.height = field.radius * 2;
        sprite.tint = field.color;
        sprite.alpha = field.alpha * shown;
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
