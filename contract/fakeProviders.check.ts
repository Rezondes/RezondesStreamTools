// Check für fakeProviders.ts: Tokens und Benutzer, EventSub und IRC über WebSocket, Spotify-Steuerung, Frames.
// Der Fake läuft auf einem freien Loopback-Port; die OAuth-App des Node-Servers spricht ihn wie echtes Twitch an.
// Token-Werte sind Platzhalter. Läuft mit npm test.
import assert from "node:assert/strict";
import { providerUrls } from "../server/providers.ts";
import { twitchApp } from "../server/twitch.ts";
import { frame, parseFrame, startFakeProviders } from "./fakeProviders.ts";

const fake = await startFakeProviders();
const post = (path: string, body: string) => fetch(`${fake.url}${path}`, { method: "POST", body });

// Nächste Nachricht eines WebSocket-Clients
function nextMessage(socket: WebSocket) {
  return new Promise<string>(done => socket.addEventListener("message", event => done(String(event.data)), { once: true }));
}
async function connect(url: string) {
  const socket = new WebSocket(url);
  const first = nextMessage(socket);
  await new Promise(done => socket.addEventListener("open", done, { once: true }));
  return { socket, first };
}

try {
  // Token und Benutzer: der Node-Server meldet sich gegen den Fake an, validate nimmt die Tokens an, revoke merkt sie sich
  const app = twitchApp("client-id", "client-secret", "http://localhost:8089/auth/callback", providerUrls(fake.env));
  const tokens = await app.exchange("code-neo-7");
  assert.ok(tokens);
  assert.equal(tokens.login, "neo");
  assert.equal(tokens.userId, "7");
  assert.equal(await app.exchange("falsch"), null);
  assert.deepEqual(await app.validate(tokens), tokens);
  assert.equal(await app.canChat(tokens), true);
  assert.equal(await app.say(tokens, "hallo"), "ok");
  assert.deepEqual(fake.chatMessages, [{ broadcaster_id: "7", sender_id: "7", message: "hallo" }]);
  await app.revoke(tokens.access);
  assert.ok(fake.revoked.has(tokens.access));
  // Widerrufen: validate erneuert mit dem Refresh-Token
  const renewed = await app.validate(tokens);
  assert.notEqual(renewed?.access, tokens.access);
  assert.equal(renewed?.login, "neo");
  assert.equal((await fetch(`${fake.url}/helix/users`)).status, 401);
  assert.equal((await fetch(`${fake.url}/nirgends`)).status, 404);

  // EventSub: erst session_welcome, dann die Notification aus der Steuerung
  const eventsub = await connect(fake.env.TWITCH_EVENTSUB_URL);
  const welcome = JSON.parse(await eventsub.first) as { metadata: { message_type: string }; payload: { session: { id: string } } };
  assert.equal(welcome.metadata.message_type, "session_welcome");
  assert.ok(welcome.payload.session.id);
  const notification = { metadata: { message_type: "notification", subscription_type: "channel.follow" }, payload: { event: { user_name: "Neo" } } };
  const received = nextMessage(eventsub.socket);
  assert.equal((await post("/control/eventsub", JSON.stringify(notification))).status, 204);
  assert.deepEqual(JSON.parse(await received), notification);
  eventsub.socket.close();

  // IRC: Zeilen des Clients kommen an, Zeilen aus der Steuerung gehen an den Client
  const irc = await connect(fake.env.TWITCH_IRC_URL);
  irc.socket.send("JOIN #neo");
  await post("/control/irc", ":neo!neo@neo.tmi.twitch.tv PRIVMSG #neo :hallo");
  assert.equal(await irc.first, ":neo!neo@neo.tmi.twitch.tv PRIVMSG #neo :hallo\r\n");
  assert.deepEqual(fake.ircReceived, ["JOIN #neo"]);
  irc.socket.close();

  // Spotify: Token, Konto und laufender Titel über die Steuerung
  const token = await (await post("/spotify-accounts/api/token", "grant_type=authorization_code&code=x")).json() as { access_token: string };
  const auth = { headers: { Authorization: `Bearer ${token.access_token}` } };
  const playing = `${fake.url}/spotify-api/me/player/currently-playing`;
  assert.equal((await fetch(playing, auth)).status, 204);
  await post("/control/spotify", JSON.stringify({ playing: { is_playing: true, item: { name: "Lied" } }, account: "Neo" }));
  assert.deepEqual(await (await fetch(playing, auth)).json(), { is_playing: true, item: { name: "Lied" } });
  assert.deepEqual(await (await fetch(`${fake.url}/spotify-api/me`, auth)).json(), { id: "fake", display_name: "Neo" });
  assert.equal((await fetch(playing)).status, 401);
  await post("/control/spotify", JSON.stringify({ token: null }));
  assert.equal((await post("/spotify-accounts/api/token", "code=x")).status, 400);
  assert.equal((await post("/control/unbekannt", "")).status, 404);
} finally {
  await fake.stop();
}

// Frames: alle drei Längenformen hin und zurück, maskierte Client-Frames, unvollständige Frames
for (const size of [5, 300, 70_000]) {
  const text = "x".repeat(size);
  const parsed = parseFrame(frame(text));
  assert.equal(parsed?.payload.toString(), text);
  assert.equal(parsed?.size, frame(text).length);
}
const masked = Buffer.from([0x81, 0x82, 1, 2, 3, 4, "h".charCodeAt(0) ^ 1, "i".charCodeAt(0) ^ 2]);
assert.equal(parseFrame(masked)?.payload.toString(), "hi");
assert.equal(parseFrame(masked.subarray(0, 5)), null);
assert.equal(parseFrame(Buffer.from([0x81])), null);
assert.equal(parseFrame(frame("x".repeat(300)).subarray(0, 3)), null);
assert.equal(parseFrame(frame("x".repeat(70_000)).subarray(0, 9)), null);

console.log("fakeProviders ok");
