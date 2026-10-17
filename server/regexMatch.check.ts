// Check für regexMatch.ts: Regex läuft im Worker, ein katastrophales Muster blockiert den Server nicht. Läuft mit npm test.
import assert from "node:assert/strict";
import { createRegexMatcher } from "./regexMatch.ts";

const matcher = createRegexMatcher(50);
assert.equal(await matcher.test("^l+i+z+", "iu", "LLLizzz"), true);
assert.equal(await matcher.test("^gg$", "iu", "gg wp"), false);

// ^(a+)+$ auf 40 a und ! bräuchte im Hauptprozess Minuten; hier: "slow" nach dem Zeitlimit
let ticks = 0;
const timer = setInterval(() => { ticks++; }, 5);
const started = Date.now();
assert.equal(await matcher.test("^(a+)+$", "u", "a".repeat(40) + "!"), "slow");
const took = Date.now() - started;
clearInterval(timer);
assert.ok(took < 1000, `Zeitlimit greift nicht (${took} ms)`);
assert.ok(ticks > 2, "der Hauptprozess war blockiert");

// Danach läuft ein neuer Worker, auch gleichzeitige Prüfungen kommen alle an
assert.deepEqual(await Promise.all([matcher.test("a", "", "a"), matcher.test("b", "", "a")]), [true, false]);

// Was hinter einer hängenden Prüfung wartet, gilt als nicht getroffen
assert.deepEqual(await Promise.all([matcher.test("^(a+)+$", "u", "a".repeat(40) + "!"), matcher.test("a", "", "a")]), ["slow", null]);
matcher.stop();
console.log("regexMatch ok");
