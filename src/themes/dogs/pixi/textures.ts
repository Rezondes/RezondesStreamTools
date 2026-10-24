// Pixel images of the Dogs theme as PixiJS textures (needs a browser canvas and WebGL): every image becomes one texture
// without smoothing (scale mode nearest), cached per image, so a pose painted once is uploaded once. destroy frees all.
import { Texture } from "pixi.js";
import { hexNumber } from "../../../core/color.ts";
import type { PixelImage } from "../pixels.ts";

const OPAQUE = 255;
const CHANNEL = 255;

function canvasOf(image: PixelImage) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  if (!context) return canvas;
  const data = context.createImageData(image.width, image.height);
  image.colors.forEach((color, index) => {
    if (!color) return;
    const value = hexNumber(color);
    data.data.set([(value >> 16) & CHANNEL, (value >> 8) & CHANNEL, value & CHANNEL, OPAQUE], index * 4);
  });
  context.putImageData(data, 0, 0);
  return canvas;
}

export type TextureCache = { of: (image: PixelImage) => Texture; destroy: () => void };

export function textureCache(): TextureCache {
  const textures = new Map<PixelImage, Texture>();
  return {
    of: image => {
      let texture = textures.get(image);
      if (!texture) {
        texture = Texture.from(canvasOf(image));
        texture.source.scaleMode = "nearest";
        textures.set(image, texture);
      }
      return texture;
    },
    destroy: () => {
      for (const texture of textures.values()) texture.destroy(true);
      textures.clear();
    },
  };
}
