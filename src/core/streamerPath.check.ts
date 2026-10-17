// Check for streamerPath.ts: splitting /s/<login>/... and allowed names. Runs with npm test.
import assert from "node:assert/strict";
import { base, isLogin, isMediaName, parse } from "./streamerPath.ts";

// Overlay paths return login and decoded path parts; the login is case-insensitive
assert.deepEqual(parse("/s/rezondes/alerts.html"), { login: "rezondes", segments: ["alerts.html"] });
assert.deepEqual(parse("/s/Rezondes/media/my%20lizard.gif"), { login: "rezondes", segments: ["media", "my lizard.gif"] });
assert.deepEqual(parse("/s/rezondes"), { login: "rezondes", segments: [] });

// Other paths, invalid logins and broken encoding: null
assert.equal(parse("/alerts.html"), null);
assert.equal(parse("/src/main.tsx"), null);
assert.equal(parse("s/rezondes/status"), null);
assert.equal(parse("/s/"), null);
assert.equal(parse("/s/../status"), null);
assert.equal(parse("/s/re%7A/status"), null);
assert.equal(parse("/s/rezondes/media/%E0"), null);

// %2F is decoded only after splitting: it stays one path part, which isMediaName then rejects
const traversal = parse("/s/rezondes/media/..%2F..%2Ftokens.json");
assert.ok(traversal);
assert.deepEqual(traversal.segments, ["media", "../../tokens.json"]);
assert.ok(!isMediaName(traversal.segments[1]));

// Logins: Twitch characters, at most 25
assert.ok(isLogin("rezondes_42"));
assert.ok(!isLogin("Rezondes"));
assert.ok(!isLogin(""));
assert.ok(!isLogin("a".repeat(26)));

// Media names: a simple name with a known extension, no path, no hidden file
assert.ok(isMediaName("lizard.gif"));
assert.ok(isMediaName("Lizard (2).MP4"));
assert.ok(!isMediaName("lizard.html"));
assert.ok(!isMediaName(".hidden.png"));
assert.ok(!isMediaName("a/b.png"));
assert.ok(!isMediaName(`${"a".repeat(101)}.png`));

// Path prefix
assert.equal(base("rezondes"), "/s/rezondes");

console.log("streamerPath ok");
