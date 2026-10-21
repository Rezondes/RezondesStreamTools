// Check for confetti.ts: the throw follows from the time (the same time, the same pieces), paw prints and leaves take
// turns, the pieces fly up first and fall later, and they are gone after their life. Runs with npm test.
import assert from "node:assert/strict";
import { CONFETTI_LIFE, confettiAt } from "./confetti.ts";

const origin = { x: 1000, y: 300 };

// Wurf aus der Zeit: deterministic, alternating icons, all at the origin at the throw
assert.deepEqual(confettiAt(4, 20, 0.7, origin), confettiAt(4, 20, 0.7, origin));
assert.notDeepEqual(confettiAt(4, 20, 0.7, origin), confettiAt(5, 20, 0.7, origin));
assert.deepEqual(confettiAt(4, 4, 0.7, origin).map(piece => piece.icon), ["pfote", "blatt", "pfote", "blatt"]);
assert.ok(confettiAt(4, 20, 0, origin).every(piece => piece.x === origin.x && piece.y === origin.y));

// Up first, then down again: on average above the origin early, lower later
const height = (seconds: number) => confettiAt(4, 40, seconds, origin).reduce((sum, piece) => sum + piece.y, 0) / 40;
assert.ok(height(0.3) < origin.y);
assert.ok(height(2.4) > height(0.6));

// Visible during the life, gone after it
assert.ok(confettiAt(4, 20, 1, origin).every(piece => piece.alpha === 1));
assert.ok(confettiAt(4, 20, CONFETTI_LIFE, origin).every(piece => piece.alpha === 0));

console.log("bears confetti ok");
