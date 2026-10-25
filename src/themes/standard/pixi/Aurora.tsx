// Light fields of the standard screens (aurora.ts): large soft sprites in both accents on closed orbits, added on top
// of each other and blurred unless the performance level is low; how fast, bright and low they are follows the screen
// (sceneLight: they fade in, BRB breathes slower, Ending sinks them away). Positions every frame
// from the clock alone, so ?t= stills match.
import { type Application, BlurFilter, Container, Sprite } from "pixi.js";
import { useEffect } from "react";
import type { ScreenKind } from "../../../core/screens/screens.ts";
import { quality } from "../../../core/three/quality.ts";
import { auroraField, auroraOptions, sceneLight } from "../aurora.ts";
import type { StandardValues } from "../settings.ts";
import { softDot } from "./softDot.ts";

type Props = { app: Application; clock: () => number; values: StandardValues; kind: ScreenKind };

// fixed: texture size in px (only its resolution, the drawn size comes from the settings)
const TEXTURE_SIZE = 512;
// fixed: passes of the blur, like the prototype
const BLUR_QUALITY = 4;

export default function Aurora({ app, clock, values, kind }: Props) {
  useEffect(() => {
    const texture = softDot(TEXTURE_SIZE, values.auroraCore, values.auroraCoreAlpha);
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
      const light = sceneLight(kind, clock(), values);
      sprites.forEach((sprite, index) => {
        const field = auroraField(options, index, light.time);
        sprite.position.set(field.x, field.y + light.drop);
        sprite.width = sprite.height = field.radius * 2;
        sprite.tint = field.color;
        sprite.alpha = field.alpha * light.alpha;
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
  }, [app, clock, values, kind]);
  return null;
}
