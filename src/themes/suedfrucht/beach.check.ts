// Check für beach.ts: Pfad-Bausteine ergeben gültige, geschlossene Pfade, jede Form hat Teile mit Pfaden.
// Läuft mit npm test (einzeln: node src/themes/suedfrucht/beach.check.ts).
import assert from "node:assert/strict";
import { circle, CLOUD, GULL, ICON_NAMES, ICONS, LEAF, PALM, petals, PLANE, spikes, wavePath, type Shape } from "./beach.ts";

// Sterne: count Spitzen ergeben 2 * count Punkte, geschlossen
const star = spikes(50, 50, 40, 20, 5);
assert.match(star, /^M50 10 L/);
assert.equal(star.split("L").length, 10);
assert.ok(star.endsWith(" Z"));

// Kreise und Blüten
assert.equal(circle(50, 50, 10), "M40 50 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 Z");
assert.equal(petals(50, 50, 20, 8, 5).split("M").length - 1, 5);

// Welle: beginnt links unten, Oberkante zwischen top - amplitude und top + amplitude, endet rechts unten
{
  const wave = wavePath(400, 10, 200, 50, 120);
  assert.match(wave, /^M0 120 L0 50 /);
  assert.ok(wave.endsWith("L400 120 Z"));
  const heights = [...wave.matchAll(/L(\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map(match => Number(match[2])).filter(height => height !== 120);
  assert.ok(heights.every(height => height >= 40 && height <= 60));
  // Nahtlos: Anfang und Ende der Oberkante gleich hoch
  assert.equal(heights[0], heights.at(-1));
}

// Jede Form hat mindestens einen Teil, jeder Pfad beginnt mit M
const shapes: Shape[] = [PALM, CLOUD, GULL, LEAF, PLANE, ...ICON_NAMES.map(name => ICONS[name])];
for (const shape of shapes) {
  assert.ok(shape.parts.length > 0);
  for (const part of shape.parts) assert.match(part.d, /^M/);
}
assert.deepEqual(ICON_NAMES, ["muschel", "seestern", "sonne", "welle", "hibiskus", "boot", "kokosnuss", "ananas"]);

console.log("suedfrucht beach ok");
