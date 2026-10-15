// Check für stinger.ts: der Übergang deckt am Übergangspunkt alles ab und ist am Anfang und Ende leer.
// Ein Mock-Canvas zählt die gefüllten Rechtecke. Läuft mit npm test.
import assert from "node:assert/strict";
import { HEIGHT, WIDTH, drawStinger, type StingerOptions } from "./stinger.ts";

function recorder() {
  const rects: number[][] = [];
  const target: Record<string, unknown> = {
    fillRect: (...args: number[]) => rects.push(args),
    measureText: () => ({ width: 10 }),
  };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? (() => {}),
    set: (object, key: string, value) => { object[key] = value; return true; },
  });
  return { context: context as unknown as CanvasRenderingContext2D, rects };
}

const options: StingerOptions = {
  duration: 2, cut: 1, fall: 0.42, column: 24, text: "> TEST", cursor: "_", showLogo: true, logo: "AB\nCD", glyphs: "01", font: "VT323",
  background: "#000000", accent: "#39ff14", dim: "#1e9e0f", flash: "#d8ffcc",
};
const columns = WIDTH / options.column;
const fullColumns = (rects: number[][]) => rects.filter(([, y, width, height]) => y === 0 && width === options.column && height === HEIGHT).length;

// Am Übergangspunkt ist jede Spalte über die ganze Höhe schwarz
const atCut = recorder();
drawStinger(atCut.context, options.cut, options);
assert.equal(fullColumns(atCut.rects), columns);

// Am Anfang und am Ende wird nichts gezeichnet
for (const time of [0, options.duration]) {
  const empty = recorder();
  drawStinger(empty.context, time, options);
  assert.deepEqual(empty.rects, [], `t = ${time}`);
}

console.log("stinger ok");
