// Check for clipInk.ts: arc letters skip spaces and count the others, a letter with scale 0 is not drawn, the outline
// comes before the letter, ink parts keep their fills, lines and dots, and the print covers the picture. Runs with
// npm test.
import assert from "node:assert/strict";
import { chefParts } from "./chef.ts";
import { arcLetters, type ArcText, drawArc, drawInk, drawPrint, inkOf, lineOf } from "./clipInk.ts";
import { INK, recorder } from "./stinger.check.ts";

const arc: ArcText = { text: "AB C", center: { x: 0, y: 600 }, radius: 600, span: 40, size: 100, font: "Titan One", stroke: 4, colors: { fill: "#fff8ec", stroke: "#f85449" } };
const canvas = recorder();
const letters = arcLetters(canvas.context, arc);
assert.deepEqual(letters.map(letter => [letter.char, letter.index]), [["A", 0], ["B", 1], ["C", 2]]);
assert.ok(letters[0].angle < 0 && letters[2].angle > 0);

// Letter 1 not there yet; every drawn letter: outline, then fill
drawArc(canvas.context, arc, letters, index => (index === 1 ? 0 : 1));
const texts = canvas.calls.filter(call => call.startsWith("strokeText(") || call.startsWith("fillText("));
assert.deepEqual(texts.map(call => call.slice(0, call.indexOf(","))), ["strokeText(A", "fillText(A", "strokeText(C", "fillText(C"]);

// The eyes of the chef: one line, two filled dots; the coat: open buttons
const eyes = inkOf(chefParts().eyes, INK, 1);
assert.equal(eyes.fills.length, 0);
assert.ok(eyes.lines.length >= 1);
const drawn = recorder();
drawInk(drawn.context, eyes, { ink: "#f85449", fill: "#fff8ec" });
assert.equal(drawn.calls.filter(call => call === "fill()").length, 2);
const coat = recorder();
drawInk(coat.context, inkOf(chefParts().body, INK, 2), { ink: "#f85449", fill: "#fff8ec" });
assert.equal(coat.calls.filter(call => call === "stroke()").length, 6);
assert.equal(inkOf(lineOf({ kind: "path", d: "M0 0 L10 10" }, 3), INK, 3).lines[0].width, 3);

// The print: spits over the whole picture, three strokes each
const print = recorder();
drawPrint(print.context, 440, 440, "#f85449");
assert.equal(print.calls.filter(call => call.startsWith("stroke(")).length, 4 * 4 * 2 * 3);

console.log("kebab clipInk ok");
