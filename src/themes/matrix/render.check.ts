// Check für render.ts des Matrix-Themes: drei Clips mit Gruppen, Länge und Übergangspunkt aus den Einstellungen.
// Läuft mit npm test.
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { matrixClips } from "./render.ts";
import { matrixSettings } from "./settings.ts";

const clips = matrixClips(resolveSettings(matrixSettings, { stingerDuration: 2, stingerCut: 1 }), "rezondes");
assert.deepEqual(clips.map(clip => [clip.name, clip.group]), [["stinger", "Stinger"], ["profile", "Banner"], ["offline", "Banner"]]);
assert.equal(clips[0].duration, 2);
assert.equal(clips[0].cut, 1);

console.log("matrix render ok");
