// Check für fx.ts: Standardwerte einer Aktion aus den Einstellungen. Läuft mit npm test.
import assert from "node:assert/strict";
import { FX_KEYS, fxDefaults } from "./fx.ts";

assert.deepEqual(fxDefaults({ fxMax: 3, fxDuration: 4, fxSize: 300, fxMargin: 5 }), { duration: 4, size: 300 });
assert.deepEqual([...FX_KEYS], ["fxMax", "fxDuration", "fxSize", "fxMargin"]);

console.log("fx ok");
