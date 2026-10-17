// Check for irc.ts: parsing IRC lines and the anonymous login. Runs with npm test.
import assert from "node:assert/strict";
import { anonymousLogin, parseIrc } from "./irc.ts";

const message = parseIrc("@badges=moderator/1;display-name=Rez\\sOndes;emotes=25:0-4 :rez!rez@rez.tmi.twitch.tv PRIVMSG #rezondes :Kappa hello : world");
assert.equal(message.command, "PRIVMSG");
assert.deepEqual(message.params, ["#rezondes", "Kappa hello : world"]);
assert.equal(message.tags["display-name"], "Rez Ondes");
assert.equal(message.prefix, "rez!rez@rez.tmi.twitch.tv");

assert.deepEqual(parseIrc("PING :tmi.twitch.tv"), { tags: {}, prefix: "", command: "PING", params: ["tmi.twitch.tv"] });
assert.deepEqual(parseIrc(":tmi.twitch.tv CLEARCHAT #rezondes").params, ["#rezondes"]);

// Anonymous login: request tags and commands, guest name with a random number, join the channel
assert.deepEqual(anonymousLogin("rezondes", () => 0.5), ["CAP REQ :twitch.tv/tags twitch.tv/commands", "PASS SCHMOOPIIE", "NICK justinfan50000", "JOIN #rezondes"]);

console.log("irc ok");
