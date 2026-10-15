// Check für streamerPath.ts: Zerlegen von /s/<login>/... und erlaubte Namen. Läuft mit npm test.
import assert from "node:assert/strict";
import { base, isLogin, isMediaName, parse } from "./streamerPath.ts";

// Overlay-Pfade liefern Login und dekodierte Pfadteile; Gross/klein im Login egal
assert.deepEqual(parse("/s/rezondes/alerts.html"), { login: "rezondes", segments: ["alerts.html"] });
assert.deepEqual(parse("/s/Rezondes/media/my%20lizard.gif"), { login: "rezondes", segments: ["media", "my lizard.gif"] });
assert.deepEqual(parse("/s/rezondes"), { login: "rezondes", segments: [] });

// Andere Pfade, ungültige Logins und kaputte Kodierung: null
assert.equal(parse("/alerts.html"), null);
assert.equal(parse("/src/main.tsx"), null);
assert.equal(parse("s/rezondes/status"), null);
assert.equal(parse("/s/"), null);
assert.equal(parse("/s/../status"), null);
assert.equal(parse("/s/re%7A/status"), null);
assert.equal(parse("/s/rezondes/media/%E0"), null);

// %2F wird erst nach dem Zerlegen dekodiert: bleibt ein Pfadteil, den isMediaName dann ablehnt
const traversal = parse("/s/rezondes/media/..%2F..%2Ftokens.json");
assert.ok(traversal);
assert.deepEqual(traversal.segments, ["media", "../../tokens.json"]);
assert.ok(!isMediaName(traversal.segments[1]));

// Logins: Twitch-Zeichen, höchstens 25
assert.ok(isLogin("rezondes_42"));
assert.ok(!isLogin("Rezondes"));
assert.ok(!isLogin(""));
assert.ok(!isLogin("a".repeat(26)));

// Mediennamen: einfacher Name mit bekannter Endung, kein Pfad, keine versteckte Datei
assert.ok(isMediaName("lizard.gif"));
assert.ok(isMediaName("Lizard (2).MP4"));
assert.ok(!isMediaName("lizard.html"));
assert.ok(!isMediaName(".hidden.png"));
assert.ok(!isMediaName("a/b.png"));
assert.ok(!isMediaName(`${"a".repeat(101)}.png`));

// Pfad-Anfang
assert.equal(base("rezondes"), "/s/rezondes");

console.log("streamerPath ok");
