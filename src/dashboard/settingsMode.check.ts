// Check for settingsMode.ts: the remembered mode of the theme settings, "einfach" whenever nothing usable is stored or
// the storage fails. Runs with npm test.
import assert from "node:assert/strict";
import { readMode, storeMode } from "./settingsMode.ts";

const memory = () => {
  const items = new Map<string, string>();
  return { getItem: (key: string) => items.get(key) ?? null, setItem: (key: string, value: string) => void items.set(key, value) };
};
const broken = { getItem: (): string | null => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };

const store = memory();
assert.equal(readMode(store), "einfach");
storeMode("erweitert", store);
assert.equal(readMode(store), "erweitert");
store.setItem("rezondes-settings-mode", "unknown");
assert.equal(readMode(store), "einfach");
assert.equal(readMode(broken), "einfach");
assert.doesNotThrow(() => storeMode("erweitert", broken));
assert.equal(readMode(null), "einfach");
assert.doesNotThrow(() => storeMode("einfach", null));

console.log("settingsMode ok");
