// Check for skin.ts: which skin belongs to which theme and what the storage returns. Runs with npm test.
import assert from "node:assert/strict";
import { THEMES } from "../themes/registry.ts";
import { applySkin, rememberedSkin, skinOf } from "./skin.ts";

// Every built-in theme has its skin, everything else (also empty or broken) gets the one of the standard theme
for (const theme of THEMES) assert.equal(skinOf(theme.id), theme.id);
assert.equal(skinOf("does-not-exist"), "standard");
assert.equal(skinOf(null), "standard");

// Set and remember with a fake document and storage; without storage (blocked) the skin applies anyway
const root = { dataset: {} as Record<string, string> };
const stored = new Map<string, string>();
Object.assign(globalThis, {
  document: { documentElement: root },
  localStorage: { getItem: (key: string) => stored.get(key) ?? null, setItem: (key: string, value: string) => stored.set(key, value) },
});
assert.equal(rememberedSkin(), null);
applySkin("urlaub");
assert.equal(root.dataset.skin, "urlaub");
assert.equal(rememberedSkin(), "urlaub");
Object.assign(globalThis, { localStorage: { getItem: () => { throw new Error("gesperrt"); }, setItem: () => { throw new Error("gesperrt"); } } });
applySkin("matrix");
assert.equal(root.dataset.skin, "matrix");
assert.equal(rememberedSkin(), null);

console.log("skin ok");
