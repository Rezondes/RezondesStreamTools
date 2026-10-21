// Canvas textures of the realistic Urlaub beach (sand grain, foam, palm fronds, bark, gull): drawn once in the browser
// with a seeded random, so the same settings give the same picture.
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import { hash } from "../../../core/hash.ts";

// A seeded sequence of values from 0 to below 1
export function sequence(seed: number) {
  let index = 0;
  return () => hash(seed * 7919 + index++);
}

// fixed: how sharp textures stay at a flat angle
const ANISOTROPY = 8;

export function canvasTexture(width: number, height: number, draw: (context: CanvasRenderingContext2D, width: number, height: number) => void, repeat?: [number, number]) {
  const canvas = document.createElement("canvas");
  [canvas.width, canvas.height] = [width, height];
  const context = canvas.getContext("2d");
  if (context) draw(context, width, height);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = ANISOTROPY;
  if (repeat) {
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(...repeat);
  }
  return texture;
}
