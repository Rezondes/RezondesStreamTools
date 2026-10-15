// Check für ircEvents.ts: was aus einer IRC-Zeile wird. Läuft mit npm test.
import assert from "node:assert/strict";
import { parseIrc } from "./irc.ts";
import { toIrcEvents } from "./ircEvents.ts";

const noEmotes = new Map<string, string>();
const fixedId = () => "generated";
const events = (line: string, withAlerts = true, emotes = noEmotes) => toIrcEvents(parseIrc(line), emotes, withAlerts, fixedId);
const ACTION_MARK = String.fromCharCode(1);

// Chatnachricht: Name, Abzeichen in der Reihenfolge der Tags, Emotes von Twitch und 7TV/BTTV/FFZ
const chat = events("@badges=moderator/1,subscriber/12;display-name=Neo;emotes=25:0-4;id=abc :neo!neo@neo.tmi.twitch.tv PRIVMSG #rezondes :Kappa catJAM", true, new Map([["catJAM", "u"]]));
assert.deepEqual(chat, [{ type: "chat", message: {
  id: "abc", login: "neo", user: "Neo", badges: ["MOD", "SUB"], action: false,
  parts: [{ name: "Kappa", url: "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/2.0" }, " ", { name: "catJAM", url: "u" }],
} }]);

// /me-Nachricht ohne id und ohne Anzeigename: Login als Name, erzeugte id, Aktion erkannt
const action = events(`:neo!neo@neo.tmi.twitch.tv PRIVMSG #rezondes :${ACTION_MARK}ACTION tanzt${ACTION_MARK}`);
assert.deepEqual(action, [{ type: "chat", message: { id: "generated", login: "neo", user: "neo", badges: [], action: true, parts: ["tanzt"] } }]);

// Bits: Chatnachricht plus Cheer-Alert ohne Cheermotes im Text; ohne Alerts nur die Nachricht
const cheerLine = "@bits=100;display-name=Tank :tank!tank@tank.tmi.twitch.tv PRIVMSG #rezondes :Cheer100 nimm das";
assert.deepEqual(events(cheerLine)[1], { type: "alert", alert: { kind: "cheer", user: "Tank", amount: 100, text: "nimm das" } });
assert.equal(events(cheerLine, false).length, 1);

// Abo-Meldungen
const notice = (tags: string, text = "") => events(`@display-name=Trinity;${tags} :tmi.twitch.tv USERNOTICE #rezondes${text ? ` :${text}` : ""}`);
assert.deepEqual(notice("msg-id=sub", "endlich"), [{ type: "alert", alert: { kind: "sub", user: "Trinity", text: "endlich" } }]);
assert.deepEqual(notice("msg-id=resub;msg-param-cumulative-months=12"), [{ type: "alert", alert: { kind: "resub", user: "Trinity", amount: 12, text: undefined } }]);
assert.deepEqual(notice("msg-id=subgift;msg-param-recipient-display-name=Neo"), [{ type: "alert", alert: { kind: "gift", user: "Trinity", amount: 1, text: "Neo" } }]);
// Einzel-Gifts einer Massen-Schenkung zählt schon submysterygift
assert.deepEqual(notice("msg-id=subgift;msg-param-community-gift-id=7"), []);
assert.deepEqual(notice("msg-id=submysterygift;msg-param-mass-gift-count=5"), [{ type: "alert", alert: { kind: "gift", user: "Trinity", amount: 5 } }]);
assert.deepEqual(notice("msg-id=raid;msg-param-displayName=Smith;msg-param-viewerCount=42"), [{ type: "alert", alert: { kind: "raid", user: "Smith", amount: 42 } }]);
assert.deepEqual(notice("msg-id=announcement"), []);
// Mit Server kommen Alerts von dort: aus dem IRC dann keine
assert.deepEqual(events("@msg-id=sub;display-name=T :tmi.twitch.tv USERNOTICE #rezondes", false), []);

// Moderation, Raum-ID und Ping
assert.deepEqual(events("@target-msg-id=abc :tmi.twitch.tv CLEARMSG #rezondes :text"), [{ type: "remove", removal: { id: "abc" } }]);
assert.deepEqual(events(":tmi.twitch.tv CLEARCHAT #rezondes :neo"), [{ type: "remove", removal: { login: "neo" } }]);
assert.deepEqual(events(":tmi.twitch.tv CLEARCHAT #rezondes"), [{ type: "remove", removal: {} }]);
assert.deepEqual(events("@room-id=123 :tmi.twitch.tv ROOMSTATE #rezondes"), [{ type: "room", roomId: "123" }]);
assert.deepEqual(events(":tmi.twitch.tv ROOMSTATE #rezondes"), []);
assert.deepEqual(events("PING :tmi.twitch.tv"), [{ type: "ping", token: "tmi.twitch.tv" }]);

console.log("ircEvents ok");
