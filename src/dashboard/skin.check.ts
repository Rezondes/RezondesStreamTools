// Check für skin.ts: welcher Skin zu welchem Theme gehört und was der Speicher liefert. Läuft mit npm test.
import assert from "node:assert/strict";
import { applySkin, rememberedSkin, skinOf } from "./skin.ts";

// Jedes eingebaute Theme hat seinen Skin, alles andere (auch leer oder kaputt) bekommt den des Standard-Themes
assert.equal(skinOf("matrix"), "matrix");
assert.equal(skinOf("suedfrucht"), "suedfrucht");
assert.equal(skinOf("standard"), "standard");
assert.equal(skinOf("gibt-es-nicht"), "standard");
assert.equal(skinOf(null), "standard");

// Setzen und merken mit nachgebautem document und Speicher; ohne Speicher (gesperrt) gilt der Skin trotzdem
const root = { dataset: {} as Record<string, string> };
const stored = new Map<string, string>();
Object.assign(globalThis, {
  document: { documentElement: root },
  localStorage: { getItem: (key: string) => stored.get(key) ?? null, setItem: (key: string, value: string) => stored.set(key, value) },
});
assert.equal(rememberedSkin(), null);
applySkin("suedfrucht");
assert.equal(root.dataset.skin, "suedfrucht");
assert.equal(rememberedSkin(), "suedfrucht");
Object.assign(globalThis, { localStorage: { getItem: () => { throw new Error("gesperrt"); }, setItem: () => { throw new Error("gesperrt"); } } });
applySkin("matrix");
assert.equal(root.dataset.skin, "matrix");
assert.equal(rememberedSkin(), null);

console.log("skin ok");
