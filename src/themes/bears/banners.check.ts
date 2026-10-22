// Check for banners.ts of the Bärenbande theme (through the clips of render.ts, so the options come from the settings):
// both banners draw title and texts, look exactly the same after one loop (seamless GIF) and move in between; without
// fairy lights the offline banner draws fewer lights. A mock canvas records the calls. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { bearsClips } from "./render.ts";
import { bearsSettings } from "./settings.ts";

// One gradient for all recordings, so equal pictures give equal calls
const gradient = { addColorStop: () => {} };

function recorder() {
  const calls: unknown[][] = [];
  const target: Record<string, unknown> = { measureText: (text: string) => ({ width: text.length * 20 }), createLinearGradient: () => gradient, createRadialGradient: () => gradient };
  const context = new Proxy(target, {
    get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { calls.push([key, ...args]); }),
    set: (_, key: string, value) => { calls.push([`set ${key}`, value]); return true; },
  });
  return { context: context as unknown as CanvasRenderingContext2D, calls };
}

const texts = (calls: unknown[][]) => calls.filter(call => call[0] === "fillText").map(call => call[1] as string);
const [, profile, offline] = bearsClips(resolveSettings(bearsSettings, {}), "neo");

for (const [clip, expected] of [
  [profile, ["Bärenbande", "Gemütliche Streams mit der Bande"]],
  [offline, ["z", "z", "z", "Gerade nicht live", "Die Bande macht ein Nickerchen in der Höhle.", "Bald wieder live", "Folgen nicht vergessen"]],
] as const) {
  // Title and texts are in the picture
  const frame = recorder();
  clip.draw(frame.context, 0);
  assert.deepEqual(texts(frame.calls), expected, clip.name);
  // Seamless: frame 0 and the frame at the loop end are equal, something moves in between
  const end = recorder();
  clip.draw(end.context, clip.duration);
  assert.deepEqual(end.calls, frame.calls, `${clip.name}: seamless`);
  const middle = recorder();
  clip.draw(middle.context, clip.duration / 2);
  assert.notDeepEqual(middle.calls, frame.calls, `${clip.name}: moves`);
}

// Without fairy lights fewer arcs on the offline banner
const arcs = (lights: boolean) => {
  const [, , clip] = bearsClips(resolveSettings(bearsSettings, { fairyLights: lights }), "neo");
  const frame = recorder();
  clip.draw(frame.context, 1);
  return frame.calls.filter(call => call[0] === "arc").length;
};
assert.ok(arcs(false) < arcs(true));

// The offline card grows with a long title up to the right edge, beyond that the title shrinks
const offlineCard = (title: string) => {
  const [, , clip] = bearsClips(resolveSettings(bearsSettings, { bannerOfflineTitle: title }), "neo");
  const frame = recorder();
  clip.draw(frame.context, 1);
  const cards = frame.calls.filter(call => call[0] === "roundRect");
  const fonts = frame.calls.filter(call => call[0] === "set font" && String(call[1]).startsWith("800"));
  return { width: cards[cards.length - 1][3] as number, font: fonts[fonts.length - 1][1] as string };
};
assert.equal(offlineCard("Weg").width, 860);
assert.ok(offlineCard("x".repeat(45)).width > 860);
assert.equal(offlineCard("x".repeat(45)).font, offlineCard("Weg").font);
assert.equal(offlineCard("x".repeat(90)).width, offlineCard("x".repeat(200)).width);
assert.notEqual(offlineCard("x".repeat(90)).font, offlineCard("Weg").font);

console.log("bears banners ok");
