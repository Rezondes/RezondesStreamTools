// The painted watercolor world of the Bärenbande screens (PLAN-BEARS.md package 11, watercolor.ts): the sky on one
// canvas, the clouds as washes of their own drifting across it (theme.css), the land and the far things on a second
// canvas, both with paper grain; painted once per look. The world paints itself in from left to right through a mask
// while --paint runs from 0 to 1 (set by the scene's timeline; 1 without one).
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { worldAt } from "./render.ts";
import { useBears } from "./useBears.ts";
import { CLOUD_SIZE, paintCloud, paintGrain, paintLand, paintSky, type WashLook } from "./watercolor.ts";
import { type TimeOfDay, WORLD } from "./world.ts";

const MAX_CLOUDS = 8;
const VIEW_BOX = `0 0 ${WORLD.width} ${WORLD.height}`;
// fixed: the grain of the sky canvas gets another seed than the land
const SKY_GRAIN_SEED = 7;

export default function WorldCanvas({ time }: { time: TimeOfDay }) {
  const values = useBears();
  const sky = useRef<HTMLCanvasElement>(null);
  const land = useRef<HTMLCanvasElement>(null);
  const [clouds, setClouds] = useState<string[]>([]);
  const colors = useMemo(() => worldAt(values, time), [values, time]);
  const look = useMemo<WashLook>(
    () => ({ seed: values.worldSeed, layers: values.washLayers, alpha: values.washAlpha, roughness: values.washRoughness, sketch: values.sketchLines, grain: values.paperGrain }),
    [values.worldSeed, values.washLayers, values.washAlpha, values.washRoughness, values.sketchLines, values.paperGrain],
  );
  const show = useMemo(() => ({ city: values.showCity, bridge: values.showBridge, cave: values.showCave, flowers: values.flowers }), [values.showCity, values.showBridge, values.showCave, values.flowers]);
  const count = Math.min(values.cloudCount, MAX_CLOUDS);

  useEffect(() => {
    const [skyContext, landContext] = [sky.current?.getContext("2d", { willReadFrequently: true }), land.current?.getContext("2d", { willReadFrequently: true })];
    if (!skyContext || !landContext) return;
    paintSky(skyContext, colors, time);
    paintGrain(skyContext, WORLD.width, WORLD.height, look.grain, look.seed + SKY_GRAIN_SEED);
    landContext.clearRect(0, 0, WORLD.width, WORLD.height);
    paintLand(landContext, colors, look, show);
    paintGrain(landContext, WORLD.width, WORLD.height, look.grain, look.seed);
  }, [colors, look, show, time]);

  useEffect(() => {
    setClouds(Array.from({ length: count }, (_, index) => {
      const canvas = document.createElement("canvas");
      [canvas.width, canvas.height] = [CLOUD_SIZE.width, CLOUD_SIZE.height];
      const context = canvas.getContext("2d");
      if (context) paintCloud(context, colors, look, index);
      return canvas.toDataURL();
    }));
  }, [colors, look, count]);

  return (
    <div className="bb-world bb-painted" aria-hidden="true">
      <canvas ref={sky} className="bb-world-canvas" width={WORLD.width} height={WORLD.height} />
      <svg className="bb-world-svg" viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid slice">
        {clouds.map((url, index) => (
          <g key={index} className="bb-cloud" style={{ "--i": index, "--n": clouds.length } as CSSProperties}>
            <image href={url} width={CLOUD_SIZE.width} height={CLOUD_SIZE.height} transform={`translate(0 ${60 + ((index * 83) % 240)}) scale(${1.4 + (index % 3) * 0.5})`} />
          </g>
        ))}
      </svg>
      <canvas ref={land} className="bb-world-canvas" width={WORLD.width} height={WORLD.height} />
    </div>
  );
}
