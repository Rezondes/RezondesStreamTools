// Sparks of the standard alert card (sparksAt in edgeTrace.ts): soft dots in both accents start on the card edge at
// the burst, fly outwards and fade, added on top of each other. A transparent PixiStage reaches MARGIN px beyond the
// card on every side; positions every frame from the clock alone.
import { type Application, Container, Sprite } from "pixi.js";
import { useCallback } from "react";
import { mixHex } from "../../../core/color.ts";
import { hash } from "../../../core/hash.ts";
import PixiStage from "../../../core/pixi/PixiStage.tsx";
import { SPARK_ROOM as MARGIN, sparkLookOf, sparksAt } from "../edgeTrace.ts";
import type { StandardValues } from "../settings.ts";
import { softDot } from "./softDot.ts";

type Props = { size: { width: number; height: number }; clock: () => number; values: StandardValues; seed: number; burstAt: number };

// fixed: texture size in px (only its resolution, the drawn size comes from the settings)
const TEXTURE_SIZE = 32;

export default function Sparks({ size, clock, values, seed, burstAt }: Props) {
  const onReady = useCallback((app: Application) => {
    const texture = softDot(TEXTURE_SIZE, values.alertSparkCore, values.alertSparkCoreAlpha);
    const look = sparkLookOf(values);
    const box = new Container();
    box.blendMode = "add";
    const count = values.alertSparksOn ? values.alertSparks : 0;
    const sprites = Array.from({ length: count }, (_, index) => {
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      sprite.tint = mixHex(values.alertSparkColor, values.alertSparkColor2, hash(seed + index));
      box.addChild(sprite);
      return sprite;
    });
    app.stage.addChild(box);
    const place = () => {
      const sparks = sparksAt(seed, count, clock() - burstAt, size, look);
      sprites.forEach((sprite, index) => {
        const spark = sparks[index];
        sprite.position.set(spark.x + MARGIN, spark.y + MARGIN);
        sprite.width = sprite.height = spark.size;
        sprite.alpha = spark.opacity;
      });
    };
    place();
    app.ticker.add(place);
    return () => {
      app.ticker.remove(place);
      box.destroy({ children: true });
      texture.destroy(true);
    };
  }, [size, clock, values, seed, burstAt]);
  return (
    <div className="standard-alert-sparks" style={{ left: -MARGIN, top: -MARGIN }}>
      <PixiStage background={null} size={{ width: size.width + 2 * MARGIN, height: size.height + 2 * MARGIN }} onReady={onReady} />
    </div>
  );
}
