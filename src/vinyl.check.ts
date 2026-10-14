// Ausführen: npm run check
import assert from "node:assert/strict";
import { vinyl } from "./vinyl.ts";

const a = vinyl(0).split("\n");
assert.equal(a.length, 21);
assert.ok(a.every(l => l.length === 42));
assert.equal(a[0][0], " "); // Ecke liegt ausserhalb der Platte
assert.equal(a[10][21], " "); // Mittelloch
assert.notEqual(vinyl(0), vinyl(Math.PI / 2)); // Drehen verändert das Bild
assert.equal(vinyl(1.234), vinyl(1.234 + Math.PI * 2)); // eine volle Umdrehung ist wieder gleich

// Über dem Cover: Rand bleibt, sonst überwiegend frei, damit das Bild durchscheint
const spaces = (s: string) => s.split(" ").length - 1;
const cover = vinyl(0, 21, true);
assert.notEqual(cover.split("\n")[10][0], " ");
assert.equal(cover.split("\n")[10][21], " ");
assert.ok(spaces(cover) > spaces(vinyl(0)) + 300);

console.log(vinyl(0.6));
console.log("vinyl ok");
