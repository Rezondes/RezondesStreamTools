// Hook of the Dogs scenes on a PixiJS stage (PixiStage): three layers (world, dogs, effects) scaled by the pixel size,
// a texture cache for the pixel images, and the tick of the scene on the ticker of the app. setup builds the sprites
// once and returns the tick that places them every frame (from the scene clock); on unmount everything is removed and
// destroyed (rule 17). setup must be stable (useCallback): a new setup rebuilds the stage.
import { type Application, Container } from "pixi.js";
import { useEffect } from "react";
import { textureCache, type TextureCache } from "./textures.ts";

export type DogStage = { world: Container; dogs: Container; effects: Container; textures: TextureCache };

export function useDogStage(app: Application, scale: number, setup: (stage: DogStage) => () => void) {
  useEffect(() => {
    const layers = { world: new Container(), dogs: new Container(), effects: new Container() };
    for (const layer of Object.values(layers)) {
      layer.scale.set(scale);
      app.stage.addChild(layer);
    }
    const textures = textureCache();
    const tick = setup({ ...layers, textures });
    tick();
    app.ticker.add(tick);
    return () => {
      app.ticker.remove(tick);
      for (const layer of Object.values(layers)) {
        app.stage.removeChild(layer);
        layer.destroy({ children: true });
      }
      textures.destroy();
    };
  }, [app, scale, setup]);
}
