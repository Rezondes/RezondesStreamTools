// Check for glClip.ts with a fake renderer: update gets exactly the drawn time before every render, the result lands in
// the 2D context, after the last frame everything is freed and built again on the next draw, the setup gets the renderer.
// Runs with npm test.
import assert from "node:assert/strict";
import { Camera, Scene } from "three";
import { glClip, type GlRenderer } from "./glClip.ts";

const log: string[] = [];
const fakeRenderer = (): GlRenderer => {
  log.push("renderer");
  return { canvas: {} as CanvasImageSource, render: () => log.push("render"), dispose: () => log.push("renderer disposed") };
};
const setup = () => {
  log.push("setup");
  return { scene: new Scene(), camera: new Camera(), update: (time: number) => log.push(`update ${time}`), dispose: () => log.push("scene disposed") };
};
const context = { clearRect: () => log.push("clear"), drawImage: () => log.push("draw") } as unknown as CanvasRenderingContext2D;

// Every frame clears the 2D context first, so transparent parts do not keep the frame before
// 1 second at 4 fps: frames at 0, 0.25, 0.5, 0.75; the order of the times does not matter
const draw = glClip({ width: 1920, height: 1080, duration: 1, fps: 4 }, setup, fakeRenderer);
draw(context, 0.5);
draw(context, 0.25);
draw(context, 0.5);
assert.deepEqual(log, ["renderer", "setup", "update 0.5", "render", "clear", "draw", "update 0.25", "render", "clear", "draw", "update 0.5", "render", "clear", "draw"]);

// The last frame frees scene and renderer; a later draw builds both again
log.length = 0;
draw(context, 0.75);
assert.deepEqual(log, ["update 0.75", "render", "clear", "draw", "scene disposed", "renderer disposed"]);
log.length = 0;
draw(context, 0);
assert.deepEqual(log, ["renderer", "setup", "update 0", "render", "clear", "draw"]);

// The setup gets the renderer of its clip (for an environment map)
let given: GlRenderer | null = null;
const made = fakeRenderer();
glClip({ width: 2, height: 2, duration: 1, fps: 1 }, renderer => { given = renderer; return setup(); }, () => made)(context, 0);
assert.equal(given, made);

console.log("glClip ok");
