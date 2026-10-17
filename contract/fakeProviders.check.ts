// Check for fakeProviders.ts: tokens and users, EventSub and IRC over WebSocket, Spotify control, frames.
// The fake runs on a free loopback port and answers like real Twitch and Spotify. Token values are placeholders.
// Runs with npm test.
import assert from "node:assert/strict";
import { frame, parseFrame, startFakeProviders } from "./fakeProviders.ts";

const fake = await startFakeProviders();
const post = (path: string, body: string) => fetch(`${fake.url}${path}`, { method: "POST", body });

// Next message of a WebSocket client
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
  // Tokens and user: the code gives tokens, validate knows the scopes, revoke ends the token, refresh renews it
  const form = (body: Record<string, string>) => post("/oauth2/token", new URLSearchParams(body).toString());
  type Answer = { access_token: string; refresh_token: string };
  const tokens = (await (await form({ grant_type: "authorization_code", code: "code-neo-7" })).json()) as Answer;
  assert.ok(tokens.access_token && tokens.refresh_token);
  assert.equal((await form({ grant_type: "authorization_code", code: "wrong" })).status, 400);
  const bearer = (access: string) => ({ headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" } });
  const user = (await (await fetch(`${fake.url}/helix/users`, bearer(tokens.access_token))).json()) as { data: { id: string; login: string }[] };
  assert.deepEqual([user.data[0].id, user.data[0].login], ["7", "neo"]);
  const validate = await fetch(`${fake.url}/oauth2/validate`, { headers: { Authorization: `OAuth ${tokens.access_token}` } });
  assert.ok(((await validate.json()) as { scopes: string[] }).scopes.includes("user:write:chat"));
  const said = await fetch(`${fake.url}/helix/chat/messages`, { method: "POST", ...bearer(tokens.access_token), body: JSON.stringify({ broadcaster_id: "7", sender_id: "7", message: "hello" }) });
  assert.equal(said.status, 200);
  assert.deepEqual(fake.chatMessages, [{ broadcaster_id: "7", sender_id: "7", message: "hello" }]);
  await post("/oauth2/revoke", new URLSearchParams({ client_id: "client-id", token: tokens.access_token }).toString());
  assert.ok(fake.revoked.has(tokens.access_token));
  assert.equal((await fetch(`${fake.url}/oauth2/validate`, { headers: { Authorization: `OAuth ${tokens.access_token}` } })).status, 401);
  const renewed = (await (await form({ grant_type: "refresh_token", refresh_token: tokens.refresh_token })).json()) as Answer;
  assert.notEqual(renewed.access_token, tokens.access_token);
  assert.equal((await fetch(`${fake.url}/helix/users`)).status, 401);
  assert.equal((await fetch(`${fake.url}/nowhere`)).status, 404);

  // EventSub: first session_welcome, then the notification from the control endpoint
  const eventsub = await connect(fake.env.TWITCH_EVENTSUB_URL);
  const welcome = JSON.parse(await eventsub.first) as { metadata: { message_type: string }; payload: { session: { id: string } } };
  assert.equal(welcome.metadata.message_type, "session_welcome");
  assert.ok(welcome.payload.session.id);
  const notification = { metadata: { message_type: "notification", subscription_type: "channel.follow" }, payload: { event: { user_name: "Neo" } } };
  const received = nextMessage(eventsub.socket);
  assert.equal((await post("/control/eventsub", JSON.stringify(notification))).status, 204);
  assert.deepEqual(JSON.parse(await received), notification);
  eventsub.socket.close();

  // IRC: lines of the client arrive, lines from the control endpoint go to the client
  const irc = await connect(fake.env.TWITCH_IRC_URL);
  irc.socket.send("JOIN #neo");
  await post("/control/irc", ":neo!neo@neo.tmi.twitch.tv PRIVMSG #neo :hello");
  assert.equal(await irc.first, ":neo!neo@neo.tmi.twitch.tv PRIVMSG #neo :hello\r\n");
  assert.deepEqual(fake.ircReceived, ["JOIN #neo"]);
  irc.socket.close();

  // Spotify: token, account and current track via the control endpoint
  const token = await (await post("/spotify-accounts/api/token", "grant_type=authorization_code&code=x")).json() as { access_token: string };
  const auth = { headers: { Authorization: `Bearer ${token.access_token}` } };
  const playing = `${fake.url}/spotify-api/me/player/currently-playing`;
  assert.equal((await fetch(playing, auth)).status, 204);
  await post("/control/spotify", JSON.stringify({ playing: { is_playing: true, item: { name: "Song" } }, account: "Neo" }));
  assert.deepEqual(await (await fetch(playing, auth)).json(), { is_playing: true, item: { name: "Song" } });
  assert.deepEqual(await (await fetch(`${fake.url}/spotify-api/me`, auth)).json(), { id: "fake", display_name: "Neo" });
  assert.equal((await fetch(playing)).status, 401);
  await post("/control/spotify", JSON.stringify({ token: null }));
  assert.equal((await post("/spotify-accounts/api/token", "code=x")).status, 400);
  assert.equal((await post("/control/unknown", "")).status, 404);
} finally {
  await fake.stop();
}

// Frames: all three length forms round trip, masked client frames, incomplete frames
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
