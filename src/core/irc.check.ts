// Run: npm run check
import assert from "node:assert/strict";
import { anonymousLogin, parseIrc, splitEmotes, splitWords } from "./irc.ts";

const kappa = { name: "Kappa", url: "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/2.0" };

const message = parseIrc("@badges=moderator/1;display-name=Rez\\sOndes;emotes=25:0-4 :rez!rez@rez.tmi.twitch.tv PRIVMSG #rezondes :Kappa hallo : welt");
assert.equal(message.command, "PRIVMSG");
assert.deepEqual(message.params, ["#rezondes", "Kappa hallo : welt"]);
assert.equal(message.tags["display-name"], "Rez Ondes");
assert.equal(message.prefix, "rez!rez@rez.tmi.twitch.tv");

assert.deepEqual(parseIrc("PING :tmi.twitch.tv"), { tags: {}, prefix: "", command: "PING", params: ["tmi.twitch.tv"] });
assert.deepEqual(parseIrc(":tmi.twitch.tv CLEARCHAT #rezondes").params, ["#rezondes"]);

assert.deepEqual(splitEmotes("Kappa hallo Kappa", "25:0-4,12-16"), [kappa, " hallo ", kappa]);
// An emoji counts as one code point
assert.deepEqual(splitEmotes("😀 Kappa", "25:2-6"), ["😀 ", kappa]);
assert.deepEqual(splitEmotes("just text"), ["just text"]);

// 7TV/BTTV/FFZ: only whole words, Twitch emotes stay untouched
const extra = new Map([["catJAM", "https://cdn.7tv.app/emote/x/2x.webp"]]);
const cat = { name: "catJAM", url: "https://cdn.7tv.app/emote/x/2x.webp" };
assert.deepEqual(splitWords([kappa, " catJAM vibes catJAMs"], extra), [kappa, " ", cat, " ", "vibes", " ", "catJAMs"]);
assert.deepEqual(splitWords(["catJAM"], extra), [cat]);
assert.deepEqual(splitWords(["hallo"], new Map()), ["hallo"]);

// Anonymous login: request tags and commands, guest name with a random number, join the channel
assert.deepEqual(anonymousLogin("rezondes", () => 0.5), ["CAP REQ :twitch.tv/tags twitch.tv/commands", "PASS SCHMOOPIIE", "NICK justinfan50000", "JOIN #rezondes"]);

console.log("irc ok");
