// Check for render.ts of the Urlaub theme: three clips with groups, sizes, length and transition point from the
// settings, the banners as stills that load their 3D part in prepare and draw their texts before. Runs with npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { urlaubClips } from "./render.ts";
import { urlaubSettings } from "./settings.ts";

const clips = urlaubClips(resolveSettings(urlaubSettings, { stingerDuration: 1.5, stingerCut: 0.8, bannerTitle: "Beach" }), "neo");
assert.deepEqual(clips.map(clip => [clip.name, clip.group, clip.width, clip.height]), [["stinger", "Stinger", 1920, 1080], ["profile", "Profilbanner", 1200, 480], ["offline", "Offline-Banner", 1920, 1080]]);
assert.equal(clips[0].duration, 1.5);
assert.equal(clips[0].cut, 0.8);
assert.match(clips[0].font, /Pacifico/);
for (const banner of clips.slice(1)) {
  assert.equal(banner.fps, 1);
  assert.equal(banner.duration, 1);
  assert.equal(banner.cut, null);
  assert.equal(typeof banner.prepare, "function");
}

// Before prepare the profile banner draws its texts alone
const texts: unknown[] = [];
const target: Record<string, unknown> = { measureText: () => ({ width: 100 }) };
const context = new Proxy(target, {
  get: (object, key: string) => object[key] ?? ((...args: unknown[]) => { if (key === "fillText") texts.push(args[0]); }),
  set: () => true,
});
clips[1].draw(context as unknown as CanvasRenderingContext2D, 0);
assert.deepEqual(texts.slice(0, 1), ["Beach"]);

console.log("urlaub render ok");
