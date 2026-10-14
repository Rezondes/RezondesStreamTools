// Ausführen: npm run check
import assert from "node:assert/strict";
import { parseIrc, splitEmotes, splitWords } from "./irc.ts";

const kappa = { name: "Kappa", url: "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/2.0" };

const msg = parseIrc("@badges=moderator/1;display-name=Rez\\sOndes;emotes=25:0-4 :rez!rez@rez.tmi.twitch.tv PRIVMSG #rezondes :Kappa hallo : welt");
assert.equal(msg.command, "PRIVMSG");
assert.deepEqual(msg.params, ["#rezondes", "Kappa hallo : welt"]);
assert.equal(msg.tags["display-name"], "Rez Ondes");
assert.equal(msg.prefix, "rez!rez@rez.tmi.twitch.tv");

assert.deepEqual(parseIrc("PING :tmi.twitch.tv"), { tags: {}, prefix: "", command: "PING", params: ["tmi.twitch.tv"] });
assert.deepEqual(parseIrc(":tmi.twitch.tv CLEARCHAT #rezondes").params, ["#rezondes"]);

assert.deepEqual(splitEmotes("Kappa hallo Kappa", "25:0-4,12-16"), [kappa, " hallo ", kappa]);
// Emoji zählt als ein Codepoint
assert.deepEqual(splitEmotes("😀 Kappa", "25:2-6"), ["😀 ", kappa]);
assert.deepEqual(splitEmotes("nur text"), ["nur text"]);

// 7TV/BTTV/FFZ: nur ganze Wörter, Twitch-Emotes bleiben unangetastet
const extra = new Map([["catJAM", "https://cdn.7tv.app/emote/x/2x.webp"]]);
const cat = { name: "catJAM", url: "https://cdn.7tv.app/emote/x/2x.webp" };
assert.deepEqual(splitWords([kappa, " catJAM vibes catJAMs"], extra), [kappa, " ", cat, " ", "vibes", " ", "catJAMs"]);
assert.deepEqual(splitWords(["catJAM"], extra), [cat]);
assert.deepEqual(splitWords(["hallo"], new Map()), ["hallo"]);

console.log("irc ok");
