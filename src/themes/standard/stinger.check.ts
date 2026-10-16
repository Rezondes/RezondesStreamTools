// Check für stinger.ts des Standard-Themes: am Übergangspunkt decken die Streifen das ganze Bild, am Anfang und Ende
// ist nichts zu sehen. Ein Mock-Canvas zählt die gefüllten Flächen. Läuft mit npm test.
import assert from "node:assert/strict";
import { drawStandardStinger, HEIGHT, WIDTH, type StandardStingerOptions } from "./stinger.ts";

function recorder() {
  const rects: number[][] = [];
  const target: Record<string, unknown> = {
    fillRect: (...args: number[]) => rects.push(args),
    measureText: () => ({ width: 10 }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
  };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? (() => {}),
    set: (object, key: string, value) => { object[key] = value; return true; },
  });
  return { context: context as unknown as CanvasRenderingContext2D, rects };
}

const options: StandardStingerOptions = { duration: 1.2, cut: 0.6, panels: 3, text: "REZONDES", font: "Inter", accent: "#7c5cff", accent2: "#22d3ee", textColor: "#ffffff" };

// Am Übergangspunkt: jeder Streifen über die volle Breite, zusammen mindestens die volle Höhe (1 px Überlappung)
const atCut = recorder();
drawStandardStinger(atCut.context, options.cut, options);
const stripes = atCut.rects.filter(([x, , width]) => x <= 0 && x + width >= WIDTH);
assert.equal(stripes.length, options.panels);
assert.ok(stripes.reduce((sum, [, , , height]) => sum + height, 0) >= HEIGHT);

// Am Anfang und am Ende keine Fläche
for (const time of [0, options.duration]) {
  const empty = recorder();
  drawStandardStinger(empty.context, time, options);
  assert.deepEqual(empty.rects.filter(([, , width]) => width > 0), [], `t = ${time}`);
}

console.log("standard stinger ok");
