// Check für render.ts des Starter-Themes: drei Clips mit Gruppen, Länge, Übergangspunkt und Schleife aus den
// Einstellungen. Läuft mit npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { starterClips } from "./render.ts";
import { starterSettings } from "./settings.ts";

const clips = starterClips(resolveSettings(starterSettings, { stingerDuration: 1.5, stingerCut: 0.7, bannerLoop: 8 }), "rezondes");
assert.deepEqual(clips.map(clip => [clip.name, clip.group]), [["stinger", "Stinger"], ["profile", "Banner"], ["offline", "Banner"]]);
assert.equal(clips[0].duration, 1.5);
assert.equal(clips[0].cut, 0.7);
assert.equal(clips[2].duration, 8);

console.log("starter render ok");
