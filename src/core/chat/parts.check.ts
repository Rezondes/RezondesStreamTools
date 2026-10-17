// Check for parts.ts: Twitch emotes from the tag and 7TV/BTTV/FFZ emotes as whole words. Runs with npm test.
import assert from "node:assert/strict";
import { splitEmotes, splitWords } from "./parts.ts";

const kappa = { name: "Kappa", url: "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/2.0" };

assert.deepEqual(splitEmotes("Kappa hello Kappa", "25:0-4,12-16"), [kappa, " hello ", kappa]);
// An emoji counts as one code point
assert.deepEqual(splitEmotes("😀 Kappa", "25:2-6"), ["😀 ", kappa]);
assert.deepEqual(splitEmotes("just text"), ["just text"]);

// 7TV/BTTV/FFZ: only whole words, Twitch emotes stay untouched
const extra = new Map([["catJAM", "https://cdn.7tv.app/emote/x/2x.webp"]]);
const cat = { name: "catJAM", url: "https://cdn.7tv.app/emote/x/2x.webp" };
assert.deepEqual(splitWords([kappa, " catJAM vibes catJAMs"], extra), [kappa, " ", cat, " ", "vibes", " ", "catJAMs"]);
assert.deepEqual(splitWords(["catJAM"], extra), [cat]);
assert.deepEqual(splitWords(["hello"], new Map()), ["hello"]);

console.log("parts ok");
