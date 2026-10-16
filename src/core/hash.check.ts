// Check für hash.ts: gleiche Werte wie die bisherige Funktion des Matrix-Stingers, alle in [0, 1), seedOf stabil.
// Läuft mit npm test (einzeln: node src/core/hash.check.ts).
import assert from "node:assert/strict";
import { hash, seedOf } from "./hash.ts";

// Werte der bisherigen Implementierung (src/themes/matrix/stinger.ts), damit Matrix-Renderer gleich bleiben
assert.deepEqual([0, 1, 2, 42, 1337].map(hash), [0.11478774505667388, 0.24678996880538762, 0.02330568921752274, 0.6052086122799665, 0.5768978667911142]);
for (let seed = -50; seed < 50; seed++) assert.ok(hash(seed) >= 0 && hash(seed) < 1, String(seed));

// Gleicher Text, gleicher seed; andere Texte meist andere
assert.equal(seedOf("neo_42"), seedOf("neo_42"));
assert.notEqual(seedOf("neo_42"), seedOf("trinity"));
assert.equal(seedOf(""), 0);

console.log("hash ok");
