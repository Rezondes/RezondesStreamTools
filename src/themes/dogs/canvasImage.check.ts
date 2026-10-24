// Check of canvasImage.ts: every run becomes one rect, scaled and moved. Also hands out recorder, a fake 2D context
// that writes every call down, for the checks of stinger.ts and banners.ts. Run: node src/themes/dogs/canvasImage.check.ts
import assert from "node:assert/strict";
import { drawPixels } from "./canvasImage.ts";
import { blankImage, setPixel } from "./pixels.ts";

// A context that records its calls as text (numbers with three decimals) and its fill style
export function recorder() {
  const calls: string[] = [];
  const write = (name: string) => (...args: unknown[]) => { calls.push(`${name}(${args.map(arg => (typeof arg === "number" ? arg.toFixed(3) : String(arg))).join(",")})`); };
  const target: Record<string, unknown> = {};
  const context = new Proxy(target, {
    get: (_, key: string) => (key in target ? target[key] : write(key)),
    set: (_, key: string, value: unknown) => { target[key] = value; calls.push(`${key}=${String(value)}`); return true; },
  }) as unknown as CanvasRenderingContext2D;
  return { context, calls };
}

const image = blankImage(4, 2);
setPixel(image, 0, 0, "#111111");
setPixel(image, 1, 0, "#111111");
setPixel(image, 3, 1, "#222222");
const canvas = recorder();
drawPixels(canvas.context, image, 5, 10, 20);
assert.deepEqual(canvas.calls, ["fillStyle=#111111", "fillRect(10.000,20.000,10.000,5.000)", "fillStyle=#222222", "fillRect(25.000,25.000,5.000,5.000)"]);

console.log("dogs canvasImage ok");
