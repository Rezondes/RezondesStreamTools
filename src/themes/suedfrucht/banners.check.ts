// Check für banners.ts des Südfrucht-Themes: beide Banner zeichnen Titel und Texte und sehen nach einer Schleife exakt
// gleich aus (nahtloses GIF). Ein Mock-Canvas zeichnet die Aufrufe auf. Läuft mit npm test.
import assert from "node:assert/strict";
import { drawSuedfruchtOfflineBanner, drawSuedfruchtProfileBanner, type SuedfruchtBannerOptions } from "./banners.ts";

// Ein Verlauf für alle Aufzeichnungen, damit gleiche Bilder gleiche Aufrufe ergeben
const gradient = { addColorStop: () => {} };

function recorder() {
  const calls: unknown[][] = [];
  const target: Record<string, unknown> = { measureText: () => ({ width: 300 }), createLinearGradient: () => gradient };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { calls.push([key, ...args]); }),
    set: (_, key: string, value) => { calls.push([`set ${key}`, value]); return true; },
  });
  return { context: context as unknown as CanvasRenderingContext2D, calls };
}

const options: SuedfruchtBannerOptions = {
  loop: 6, font: "Fredoka", titleFont: "Pacifico", skyTop: "#2fa8ec", skyBottom: "#b8ecff", eveningTop: "#ff5f6d", eveningBottom: "#ffc371",
  sun: "#ffd23f", sea: "#1fb5c9", seaDeep: "#0b6f8e", foam: "#f4fffd", sand: "#f2d49b", palmLeaf: "#2e9e4f", palmTrunk: "#8b5a2b",
  wood: "#d39a5c", woodDark: "#8a5527", textColor: "#ffffff", textOnWood: "#3b2412",
  title: "Strand", profileText: "Sonne und Streams", offlineTitle: "Gerade am Strand", offlineText: "Folge dem Kanal", offlineLines: ["Bald live", "Bis gleich"],
};
const texts = (calls: unknown[][]) => calls.filter(call => call[0] === "fillText").map(call => call[1]);

for (const [draw, expected] of [
  [drawSuedfruchtProfileBanner, ["Strand", "Sonne und Streams"]],
  [drawSuedfruchtOfflineBanner, ["Gerade am Strand", "Folge dem Kanal", "Bald live", "Bis gleich"]],
] as const) {
  // Titel und Texte stehen im Bild
  const frame = recorder();
  draw(frame.context, 0, options);
  assert.deepEqual(texts(frame.calls), expected, draw.name);
  // Nahtlos: Bild 0 und Bild am Schleifenende gleich
  const end = recorder();
  draw(end.context, options.loop, options);
  assert.deepEqual(end.calls, frame.calls, draw.name);
}

console.log("suedfrucht banners ok");
