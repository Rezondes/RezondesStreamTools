// Check for ircEvents.ts: what an IRC line turns into. Runs with npm test.
import assert from "node:assert/strict";
import { parseIrc } from "./irc.ts";
import { toIrcEvents } from "./ircEvents.ts";

const noEmotes = new Map<string, string>();
const fixedId = () => "generated";
const events = (line: string, withAlerts = true, emotes = noEmotes) => toIrcEvents(parseIrc(line), emotes, withAlerts, fixedId);
const ACTION_MARK = String.fromCharCode(1);

// Chat message: name, badges in the order of the tags, emotes from Twitch and 7TV/BTTV/FFZ
const chat = events("@badges=moderator/1,subscriber/12;display-name=Neo;emotes=25:0-4;id=abc :neo!neo@neo.tmi.twitch.tv PRIVMSG #rezondes :Kappa catJAM", true, new Map([["catJAM", "u"]]));
assert.deepEqual(chat, [{ type: "chat", message: {
  id: "abc", login: "neo", user: "Neo", badges: ["MOD", "SUB"], action: false,
  parts: [{ name: "Kappa", url: "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/2.0" }, " ", { name: "catJAM", url: "u" }],
} }]);

// /me message without id and without display name: login as name, generated id, action detected
const action = events(`:neo!neo@neo.tmi.twitch.tv PRIVMSG #rezondes :${ACTION_MARK}ACTION tanzt${ACTION_MARK}`);
assert.deepEqual(action, [{ type: "chat", message: { id: "generated", login: "neo", user: "neo", badges: [], action: true, parts: ["tanzt"] } }]);

// Bits: chat message plus cheer alert without cheermotes in the text; without alerts only the message
const cheerLine = "@bits=100;display-name=Tank :tank!tank@tank.tmi.twitch.tv PRIVMSG #rezondes :Cheer100 take that";
assert.deepEqual(events(cheerLine)[1], { type: "alert", alert: { kind: "cheer", user: "Tank", amount: 100, text: "take that" } });
assert.equal(events(cheerLine, false).length, 1);

// Sub notices
const notice = (tags: string, text = "") => events(`@display-name=Trinity;${tags} :tmi.twitch.tv USERNOTICE #rezondes${text ? ` :${text}` : ""}`);
assert.deepEqual(notice("msg-id=sub", "endlich"), [{ type: "alert", alert: { kind: "sub", user: "Trinity", text: "endlich" } }]);
assert.deepEqual(notice("msg-id=resub;msg-param-cumulative-months=12"), [{ type: "alert", alert: { kind: "resub", user: "Trinity", amount: 12, text: undefined } }]);
assert.deepEqual(notice("msg-id=subgift;msg-param-recipient-display-name=Neo"), [{ type: "alert", alert: { kind: "gift", user: "Trinity", amount: 1, text: "Neo" } }]);
// submysterygift already counts the single gifts of a mass gifting
assert.deepEqual(notice("msg-id=subgift;msg-param-community-gift-id=7"), []);
assert.deepEqual(notice("msg-id=submysterygift;msg-param-mass-gift-count=5"), [{ type: "alert", alert: { kind: "gift", user: "Trinity", amount: 5 } }]);
assert.deepEqual(notice("msg-id=raid;msg-param-displayName=Smith;msg-param-viewerCount=42"), [{ type: "alert", alert: { kind: "raid", user: "Smith", amount: 42 } }]);
assert.deepEqual(notice("msg-id=announcement"), []);
// With a server, alerts come from there: then none from IRC
assert.deepEqual(events("@msg-id=sub;display-name=T :tmi.twitch.tv USERNOTICE #rezondes", false), []);

// Moderation, room ID and ping
assert.deepEqual(events("@target-msg-id=abc :tmi.twitch.tv CLEARMSG #rezondes :text"), [{ type: "remove", removal: { id: "abc" } }]);
assert.deepEqual(events(":tmi.twitch.tv CLEARCHAT #rezondes :neo"), [{ type: "remove", removal: { login: "neo" } }]);
assert.deepEqual(events(":tmi.twitch.tv CLEARCHAT #rezondes"), [{ type: "remove", removal: {} }]);
assert.deepEqual(events("@room-id=123 :tmi.twitch.tv ROOMSTATE #rezondes"), [{ type: "room", roomId: "123" }]);
assert.deepEqual(events(":tmi.twitch.tv ROOMSTATE #rezondes"), []);
assert.deepEqual(events("PING :tmi.twitch.tv"), [{ type: "ping", token: "tmi.twitch.tv" }]);

console.log("ircEvents ok");
