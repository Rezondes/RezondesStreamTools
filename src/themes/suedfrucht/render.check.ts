// Check für render.ts des Südfrucht-Themes: drei Clips mit Gruppen, Länge, Übergangspunkt und Schleife aus den
// Einstellungen. Läuft mit npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { suedfruchtClips } from "./render.ts";
import { suedfruchtSettings } from "./settings.ts";

const clips = suedfruchtClips(resolveSettings(suedfruchtSettings, { stingerDuration: 1.5, stingerCut: 0.8, bannerLoop: 8, bannerProfileFps: 15 }), "neo");
assert.deepEqual(clips.map(clip => [clip.name, clip.group, clip.width, clip.height]), [["stinger", "Stinger", 1920, 1080], ["profile", "Banner", 1200, 480], ["offline", "Banner", 1920, 1080]]);
assert.equal(clips[0].duration, 1.5);
assert.equal(clips[0].cut, 0.8);
assert.equal(clips[1].fps, 15);
assert.equal(clips[2].duration, 8);
assert.match(clips[0].font, /Pacifico/);

console.log("suedfrucht render ok");
