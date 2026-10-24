// Scenery of the Dogs skin behind the dashboard (DESIGN-DOGS.md "Dashboard-Skin"): at the bottom a pixel meadow with
// the fence and clouds, at the right the streamer's dog asleep, all as SVG rects of the pixel kit (no WebGL in the
// dashboard), with the default values. The skin CSS hides the dog and the clouds on narrow screens.
import { useMemo } from "react";
import { BREED_IDS, isBreed } from "./breeds.ts";
import { dogCache } from "./dog.ts";
import { dogLookOf, worldColorsOf } from "./looks.ts";
import { blankImage, rowRuns, type PixelImage } from "./pixels.ts";
import { poseAt } from "./poses.ts";
import type { DogsValues } from "./settings.ts";
import { cloudImage, fence, meadow } from "./world.ts";

// fixed: the meadow band in world pixels: 384 wide, the fence at 30, grass from 44; three clouds (their places are in
// the skin CSS)
const BAND = { width: 384, height: 64, fence: 30, grass: 44, flowers: 30, seed: 3 };
const CLOUD_SCALES = [0.8, 1, 0.8];

function band(values: DogsValues): PixelImage {
  const colors = worldColorsOf(values);
  const image = blankImage(BAND.width, BAND.height);
  meadow(image, BAND.grass, colors, BAND.flowers, BAND.seed);
  fence(image, BAND.fence, colors);
  return image;
}

function Pixels({ image, className }: { image: PixelImage; className: string }) {
  const runs = useMemo(() => rowRuns(image), [image]);
  return (
    <svg className={className} viewBox={`0 0 ${image.width} ${image.height}`} shapeRendering="crispEdges" preserveAspectRatio="xMidYMax slice">
      {runs.map(run => <rect key={`${run.x}-${run.y}`} x={run.x} y={run.y} width={run.width} height={1} fill={run.color} />)}
    </svg>
  );
}

export default function SkinScenery({ values }: { values: DogsValues }) {
  const meadowBand = useMemo(() => band(values), [values]);
  const clouds = useMemo(() => CLOUD_SCALES.map(scale => cloudImage(worldColorsOf(values), scale)), [values]);
  const sleeping = useMemo(() => {
    const breed = isBreed(values.dog) ? values.dog : BREED_IDS[0];
    return dogCache(dogLookOf(values, breed, values.coat)).pose(poseAt({ time: 0, mode: "lie", fps: values.walkFps, wagSpeed: 0, blinkEvery: 0, pant: false }));
  }, [values]);
  return (
    <>
      {clouds.map((image, index) => <Pixels key={index} image={image} className={`skin-cloud skin-cloud-${index + 1}`} />)}
      <Pixels image={meadowBand} className="skin-meadow" />
      <Pixels image={sleeping} className="skin-dog" />
    </>
  );
}
