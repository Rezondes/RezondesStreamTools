// Overview of all breeds and coats of the Dogs theme (starting.html?demo&preview&sheet, PLAN-DOGS.md package 1 AC9):
// per breed a row, per coat a cell with the dog on a strip of grass, in the pose of ?mode= (stand, walk, bark, lie);
// the names as labels. Compared with refs/shots/sheet.png for the style review.
import type { Application } from "pixi.js";
import { Sprite } from "pixi.js";
import { useCallback, useMemo, useState } from "react";
import { params } from "../../../core/params.ts";
import PixiStage from "../../../core/pixi/PixiStage.tsx";
import { useStage } from "../../../core/screens/useStage.ts";
import { BREED_IDS, BREEDS } from "../breeds.ts";
import { coatsOf } from "../coats.ts";
import { dogCache } from "../dog.ts";
import { dogLookOf } from "../looks.ts";
import { blankImage } from "../pixels.ts";
import { MODES, poseAt, type PoseMode } from "../poses.ts";
import type { DogsValues } from "../settings.ts";
import { useDogs } from "../useDogs.ts";
import { sceneClock } from "../useFrame.ts";
import { fillRect } from "../world.ts";
import { type DogStage, useDogStage } from "./useDogStage.ts";

// fixed: the sheet in world pixels at 3 stage px per pixel: a name column, cells of 132 x 56, a grass strip 4 high;
// a dog stands 5 pixels above the bottom of its image
const SHEET = { scale: 3, nameWidth: 100, cell: { width: 132, height: 56 }, top: 2, grass: 4, feet: 5 };
const MODE: PoseMode = (MODES as readonly string[]).includes(params.get("mode") ?? "") ? (params.get("mode") as PoseMode) : "stand";

const cells = BREED_IDS.flatMap((breed, row) => coatsOf(breed).map((coat, column) => ({ breed, coat, row, column })));
const cellLeft = (column: number) => SHEET.nameWidth + column * SHEET.cell.width;
const cellGround = (row: number) => SHEET.top + (row + 1) * SHEET.cell.height - SHEET.grass;

function SheetDogs({ app, values, clock }: { app: Application; values: DogsValues; clock: () => number }) {
  const caches = useMemo(() => cells.map(cell => dogCache(dogLookOf(values, cell.breed, cell.coat.id))), [values]);
  const setup = useCallback((stage: DogStage) => {
    const ground = blankImage(SHEET.cell.width - SHEET.grass, SHEET.grass);
    fillRect(ground, 0, 0, ground.width, ground.height, values.grass);
    const sprites = cells.map((cell, index) => {
      stage.world.addChild(new Sprite(stage.textures.of(ground))).position.set(cellLeft(cell.column), cellGround(cell.row));
      const sprite = stage.dogs.addChild(new Sprite());
      sprite.position.set(cellLeft(cell.column) + Math.round((SHEET.cell.width - caches[index].width) / 2), cellGround(cell.row) - caches[index].height + SHEET.feet);
      return sprite;
    });
    return () => {
      const time = clock();
      sprites.forEach((sprite, index) => {
        sprite.texture = stage.textures.of(caches[index].pose(poseAt({ time, mode: MODE, fps: values.walkFps, wagSpeed: values.wagSpeed, blinkEvery: values.blinkEvery, pant: values.pant })));
      });
    };
  }, [caches, clock, values]);
  useDogStage(app, SHEET.scale, setup);
  return null;
}

export default function BreedSheet() {
  const values = useDogs();
  const stage = useStage();
  const [clock] = useState(sceneClock);
  const [app, setApp] = useState<Application | null>(null);
  const onReady = useCallback((ready: Application) => {
    setApp(ready);
    return () => setApp(null);
  }, []);
  return (
    <div className="dg-screen dg-sheet">
      <PixiStage background={values.cream} onReady={onReady} className="dg-world" />
      {app && <SheetDogs app={app} values={values} clock={clock} />}
      <div className="dg-stage stage-box" ref={stage}>
        {BREED_IDS.map((breed, row) => <div key={breed} className="dg-sheet-name" style={{ top: `${(cellGround(row) - SHEET.cell.height / 2) * SHEET.scale}px` }}>{BREEDS[breed].name}</div>)}
        {cells.map(cell => (
          <div key={`${cell.breed}-${cell.coat.id}`} className="dg-sheet-coat" style={{ left: `${(cellLeft(cell.column) + SHEET.cell.width / 2) * SHEET.scale}px`, top: `${(cellGround(cell.row) + SHEET.grass) * SHEET.scale}px` }}>{cell.coat.name}</div>
        ))}
      </div>
    </div>
  );
}
