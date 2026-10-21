// The world of the Plantage screens drawn into a PixiJS container (world.ts, tree.ts): sky from dawn to morning, sun with
// glow and turning rays, clouds, two hills, three tree rows, the field with furrows, front trees, crates and grass; every
// layer moves with the camera by its share, far layers are blurred and hazy, trees and grass sway, the world brightens
// with the sunrise. Every frame is placed from the clock alone, so stills (?t=) match the live scene.
import { type Application, BlurFilter, ColorMatrixFilter, Container, Graphics, Sprite, Text, Texture } from "pixi.js";
import { useEffect } from "react";
import { mixHex } from "../../../core/color.ts";
import { quality } from "../../../core/three/quality.ts";
import type { PlantageValues } from "../settings.ts";
import { type Shape, swayAt, type SWAY, tree, type TreeColors } from "../tree.ts";
import { cameraAt, cloudSpots, cloudX, crate, CRATES, FIELD, furrows, grassTufts, hillLine, HILLS, sunriseAt, worldLayers, type WorldLayer as Layer } from "../world.ts";

type Props = { app: Application; world: Container; clock: () => number; values: PlantageValues };
type Swaying = { node: Container; phase: number; kind: keyof typeof SWAY };

// fixed: the look of the prototype (refs/starting.html) in stage px
const SKY_HEIGHT = 700;
const SUN = { x: 520, low: 700, rise: 330, size: 70, glow: 620, rays: 14, rayWidth: 0.06, rayLength: 900, rayAlpha: 0.09, turn: 0.03 };
const DIM = { dark: 0.55, desaturate: -0.5 };
const GRASS_TUFTS = 16;
const CLOUD_PUFFS: readonly [number, number, number][] = [[0, 0, 60], [55, -18, 50], [105, 2, 54], [40, 18, 52], [85, 22, 44]];

// Shapes of tree.ts and world.ts into a Graphics
export function drawShapes(graphics: Graphics, shapes: readonly Shape[]): Graphics {
  for (const shape of shapes) {
    if (shape.kind === "circle") graphics.circle(shape.x, shape.y, shape.r);
    else if (shape.kind === "ellipse") graphics.ellipse(shape.x, shape.y, shape.rx, shape.ry);
    else if (shape.radius) graphics.roundRect(shape.x, shape.y, shape.w, shape.h, shape.radius);
    else graphics.rect(shape.x, shape.y, shape.w, shape.h);
    graphics.fill({ color: shape.color, alpha: shape.alpha ?? 1 });
  }
  return graphics;
}

function gradient(stops: readonly [number, string][], radial = false): Texture {
  const canvas = document.createElement("canvas");
  canvas.width = radial ? 256 : 4;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) return Texture.WHITE;
  const fill = radial ? context.createRadialGradient(128, 128, 0, 128, 128, 128) : context.createLinearGradient(0, 0, 0, 256);
  for (const [offset, color] of stops) fill.addColorStop(offset, color);
  context.fillStyle = fill;
  context.fillRect(0, 0, canvas.width, canvas.height);
  return Texture.from(canvas);
}

export const treeColors = (values: PlantageValues): TreeColors => ({
  sky: values.skyMorningBottom, trunk: values.trunk, trunkDark: values.woodDark, leafDark: values.leafDark, leaf: values.leaf,
  leafLight: values.accent2, mango: values.mango, mangoBlush: values.mangoBlush, gloss: values.paper, shadow: values.textOnWood,
});

function skyParts(values: PlantageValues) {
  const dawn = new Sprite(gradient([[0, values.skyDawnTop], [0.55, mixHex(values.skyDawnTop, values.skyDawnBottom, 0.6)], [1, values.skyDawnBottom]]));
  const day = new Sprite(gradient([[0, values.skyMorningTop], [1, values.skyMorningBottom]]));
  for (const sprite of [dawn, day]) { sprite.width = 1920; sprite.height = SKY_HEIGHT; }
  const glow = new Sprite(gradient([[0, values.sun], [1, `${values.sun}00`]], true));
  glow.anchor.set(0.5);
  glow.width = glow.height = SUN.glow;
  const sun = new Graphics().circle(0, 0, SUN.size).fill(values.sun);
  const rays = new Graphics();
  for (let ray = 0; ray < SUN.rays; ray++) {
    const angle = (ray / SUN.rays) * Math.PI * 2;
    const [from, to] = [angle - SUN.rayWidth, angle + SUN.rayWidth];
    rays.poly([0, 0, Math.cos(from) * SUN.rayLength, Math.sin(from) * SUN.rayLength, Math.cos(to) * SUN.rayLength, Math.sin(to) * SUN.rayLength]).fill({ color: values.paper, alpha: SUN.rayAlpha });
  }
  rays.visible = values.raysOn;
  return { dawn, day, glow, sun, rays };
}

function clouds(box: Container, values: PlantageValues, haze: (color: string) => string) {
  for (const spot of cloudSpots(values.cloudCount)) {
    const cloud = new Graphics();
    for (const [x, y, size] of CLOUD_PUFFS) cloud.circle(x * spot.size, y * spot.size, size * spot.size).fill({ color: haze(values.paper), alpha: 0.9 });
    cloud.ellipse(52 * spot.size, 40 * spot.size, 120 * spot.size, 14 * spot.size).fill({ color: values.wood, alpha: 0.35 });
    cloud.position.set(spot.x, spot.y);
    box.addChild(cloud);
  }
}

function front(box: Container, values: PlantageValues, sway: Swaying[]) {
  if (values.crates) for (const spot of CRATES) {
    const node = new Container();
    node.addChild(drawShapes(new Graphics(), crate({ wood: values.wood, woodDark: values.woodDark, shadow: values.textOnWood, mango: values.mango, mangoBlush: values.mangoBlush, gloss: values.paper })));
    node.position.set(spot.x, spot.y);
    if (spot.label && values.crateName) {
      const label = new Text({ text: values.channelName.toUpperCase(), style: { fontFamily: values.titleFont, fontWeight: "700", fontSize: 40, fill: values.textOnWood } });
      label.anchor.set(0.5);
      label.position.set(0, -55);
      node.addChild(label);
    }
    box.addChild(node);
  }
  grassTufts(values.worldSeed, GRASS_TUFTS).forEach((tuft, index) => {
    const grass = new Graphics();
    tuft.blades.forEach((height, blade) => grass.poly([(blade - 2) * 9, 0, (blade - 2) * 9 + 5, 0, (blade - 2) * 22 + 4, -height]).fill(blade % 2 ? values.leaf : values.accent2));
    grass.position.set(tuft.x, 1085);
    box.addChild(grass);
    sway.push({ node: grass, phase: index, kind: "grass" });
  });
}

// The contents of one depth layer
function fill(layer: Layer, values: PlantageValues, sway: Swaying[]): Container {
  const box = new Container();
  const haze = (color: string) => mixHex(color, values.skyMorningBottom, layer.haze);
  if (layer.id === "clouds" && values.clouds) clouds(box, values, haze);
  if (layer.id === "hillsFar" && values.hills) box.addChild(new Graphics().poly(hillLine(HILLS.far)).fill(haze(values.hillColor)));
  if (layer.id === "hillsNear" && values.hills) box.addChild(new Graphics().poly(hillLine(HILLS.near)).fill(haze(values.hillFarColor)));
  if (layer.id === "field") {
    const field = new Graphics().poly([-200, FIELD.horizon, 2120, FIELD.horizon, 2120, 1080, -200, 1080]).fill(values.soil);
    for (const quad of furrows()) field.poly(quad).fill({ color: values.soilDark, alpha: 0.5 });
    field.rect(-200, FIELD.grassTop, 2320, FIELD.grassHeight).fill({ color: values.accent2, alpha: 0.9 });
    box.addChild(field);
  }
  for (const spot of layer.trees) {
    const node = drawShapes(new Graphics(), tree(spot.scale, layer.haze, treeColors(values), values.mangosOnTrees));
    node.position.set(spot.x, spot.ground);
    box.addChild(node);
    sway.push({ node, phase: spot.sway, kind: "tree" });
  }
  if (layer.id === "front") front(box, values, sway);
  return box;
}

// Things standing in the near tree row (the picker) move with its share of the camera swing and sit between it and the
// front layer; the world container sorts its children by zIndex
export const NEAR_MOVE = 0.85;
const LAYER_STEP = 10;
export const NEAR_Z = 6 * LAYER_STEP + LAYER_STEP / 2;

export default function WorldLayer({ app, world, clock, values }: Props) {
  useEffect(() => {
    const effects = quality(values.quality).bloom;
    const { dawn, day, glow, sun, rays } = skyParts(values);
    const sky = new Container();
    sky.addChild(dawn, day, rays, glow, sun);
    sky.zIndex = -LAYER_STEP;
    const sway: Swaying[] = [];
    const options = { seed: values.worldSeed, treeRowsFar: values.treeRowsFar, treeRowsMid: values.treeRowsMid, farBlur: values.farBlur, hazeFar: values.hazeFar / 100 };
    const layers = worldLayers(options).map((layer, index) => {
      const box = fill(layer, values, sway);
      if (effects && layer.blur > 0) box.filters = [new BlurFilter({ strength: layer.blur, quality: 3 })];
      box.zIndex = index * LAYER_STEP;
      return { layer, box };
    });
    const parts = [sky, ...layers.map(entry => entry.box)];
    world.sortableChildren = true;
    world.addChild(...parts);
    const dim = new ColorMatrixFilter();
    world.filters = effects ? [dim] : [];
    const spots = cloudSpots(values.cloudCount);
    const cloudBox = layers.find(entry => entry.layer.id === "clouds")?.box;

    const place = () => {
      const seconds = clock();
      const sunrise = sunriseAt(seconds, values.sunriseMs, values.sunriseOn);
      const camera = cameraAt(seconds, values.parallaxSeconds, values.parallaxOn) * values.parallaxAmount;
      day.alpha = sunrise;
      for (const node of [sun, glow, rays]) node.position.set(SUN.x, SUN.low - sunrise * SUN.rise);
      rays.rotation = seconds * SUN.turn;
      rays.alpha = sunrise;
      glow.alpha = 0.4 + sunrise * 0.6;
      for (const { layer, box } of layers) box.x = -camera * layer.move;
      cloudBox?.children.forEach((cloud, index) => { cloud.x = cloudX(spots[index].x, index, seconds); });
      for (const entry of sway) entry.node.skew.x = swayAt(seconds, entry.phase, values.swayAmount, entry.kind);
      const bright = DIM.dark + (1 - DIM.dark) * sunrise;
      dim.reset();
      dim.brightness(bright, false);
      dim.saturate((1 - bright) * DIM.desaturate, true);
    };
    place();
    app.ticker.add(place);
    return () => {
      app.ticker.remove(place);
      world.filters = [];
      for (const part of parts) {
        world.removeChild(part);
        part.destroy({ children: true, texture: true });
      }
    };
  }, [app, world, clock, values]);
  return null;
}
