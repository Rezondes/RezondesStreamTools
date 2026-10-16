// Check für stinger.ts des Südfrucht-Themes: am Übergangspunkt deckt die Welle das ganze Bild, am Anfang und Ende
// ist nichts zu sehen, gleiche Zeit ergibt dieselben Zeichenbefehle. Ein Mock-Canvas zeichnet alles auf.
// Läuft mit npm test.
import assert from "node:assert/strict";
import { drawSuedfruchtStinger, HEIGHT, WIDTH, type SuedfruchtStingerOptions } from "./stinger.ts";

function recorder() {
  const calls: unknown[][] = [];
  const target: Record<string, unknown> = { measureText: () => ({ width: 10 }) };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { calls.push([key, ...args]); }),
    set: (_, key: string, value) => { calls.push([`set ${key}`, value]); return true; },
  });
  const rects = () => calls.filter(call => call[0] === "fillRect").map(call => call.slice(1) as number[]);
  return { context: context as unknown as CanvasRenderingContext2D, calls, rects };
}

const options: SuedfruchtStingerOptions = {
  duration: 1.4, cut: 0.7, waves: 3, foam: true, palm: true, text: "Strand", font: "Pacifico",
  sea: "#1fb5c9", seaDeep: "#0b6f8e", foamColor: "#f4fffd", textColor: "#ffffff", palmColor: "#3b2412",
};

// Am Übergangspunkt: eine Fläche über das ganze Bild, dazu der Text
const atCut = recorder();
drawSuedfruchtStinger(atCut.context, options.cut, options);
assert.ok(atCut.rects().some(([x, y, width, height]) => x <= 0 && x + width >= WIDTH && y <= 0 && height >= HEIGHT));
assert.ok(atCut.calls.some(call => call[0] === "fillText" && call[1] === "Strand"));

// Am Anfang und am Ende keine Fläche und kein Text
for (const time of [0, options.duration]) {
  const empty = recorder();
  drawSuedfruchtStinger(empty.context, time, options);
  assert.deepEqual(empty.rects().filter(([, , width]) => width > 0), [], `t = ${time}`);
  assert.ok(!empty.calls.some(call => call[0] === "fillText"), `t = ${time}`);
}

// Gleiche Zeit, gleiche Zeichenbefehle (kein Zufall)
const first = recorder();
const second = recorder();
drawSuedfruchtStinger(first.context, 0.37, options);
drawSuedfruchtStinger(second.context, 0.37, options);
assert.deepEqual(first.calls, second.calls);

console.log("suedfrucht stinger ok");
