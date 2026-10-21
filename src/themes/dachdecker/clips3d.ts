// The 3D draw function of the Dachdecker stinger, loaded lazily by render.ts (prepare) so three.js stays out of the entry
// chunk: the drawing of sheet.ts is printed once on a canvas, glClip renders the scene of stinger.ts frame by frame into
// the 2D clip.
import { glClip } from "../../core/three/glClip.ts";
import { STINGER_SIZE } from "./roll.ts";
import { drawSheet, type SheetOptions } from "./sheet.ts";
import { type StingerOptions, stingerSetup } from "./stinger.ts";

function printed(sheet: SheetOptions) {
  const canvas = document.createElement("canvas");
  canvas.width = sheet.width;
  canvas.height = sheet.height;
  const context = canvas.getContext("2d");
  if (context) drawSheet(context, sheet);
  return canvas;
}

export const stingerDraw = (options: StingerOptions, sheet: SheetOptions) =>
  glClip({ ...STINGER_SIZE, fps: options.fps, duration: options.duration }, () => stingerSetup(options, printed(sheet)));
