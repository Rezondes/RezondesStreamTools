// Check for twitch.ts: check tokens, EventSub events to alerts, the OAuth app and the EventSub connection.
// fetch, WebSocket and timers are fakes: no network, no waiting. Token values are placeholders. Runs with npm test.
import assert from "node:assert/strict";
import { mock } from "node:test";
import type { Alert } from "../src/core/types.ts";
import { providerUrls } from "./providers.ts";
import { eventSub, isAlertKind, SAMPLE_ALERTS, toAlert, toTokens, twitchApp, type TwitchTokens } from "./twitch.ts";

const tokens: TwitchTokens = { access: "access-1", refresh: "refresh-1", userId: "42", login: "rezondes" };

// toTokens: only complete tokens with a valid login and a numeric user ID
assert.deepEqual(toTokens({ ...tokens, extra: "weg" }), tokens);
assert.equal(toTokens(null), null);
assert.equal(toTokens("text"), null);
assert.equal(toTokens({ ...tokens, access: "" }), null);
assert.equal(toTokens({ ...tokens, userId: "abc" }), null);
assert.equal(toTokens({ ...tokens, login: "Not A Login" }), null);

// toAlert: every subscription kind becomes the matching alert
assert.deepEqual(toAlert("channel.follow", { user_name: "neo" }), { kind: "follow", user: "neo" });
assert.deepEqual(toAlert("channel.subscribe", { user_name: "neo", tier: "2000" }), { kind: "sub", user: "neo", detail: "Tier 2" });
assert.deepEqual(toAlert("channel.subscribe", { user_name: "neo", tier: "1000" }), { kind: "sub", user: "neo", detail: undefined });
// channel.subscription.gift already reports single gifted subs
assert.equal(toAlert("channel.subscribe", { user_name: "neo", is_gift: true }), null);
assert.deepEqual(toAlert("channel.subscription.message", { user_name: "neo", cumulative_months: 12, message: { text: "hi" }, tier: "3000" }),
  { kind: "resub", user: "neo", amount: 12, text: "hi", detail: "Tier 3" });
assert.deepEqual(toAlert("channel.subscription.gift", { user_name: null, is_anonymous: true, total: 5 }), { kind: "gift", user: "Anonym", amount: 5 });
// Cheermotes disappear from the text
assert.deepEqual(toAlert("channel.cheer", { user_name: "tank", bits: 100, message: "Cheer100 take that" }), { kind: "cheer", user: "tank", amount: 100, text: "take that" });
assert.deepEqual(toAlert("channel.cheer", { user_name: "tank", bits: 1, message: "Cheer1" }), { kind: "cheer", user: "tank", amount: 1, text: undefined });
assert.deepEqual(toAlert("channel.raid", { from_broadcaster_user_name: "smith", viewers: 42 }), { kind: "raid", user: "smith", amount: 42 });
assert.deepEqual(toAlert("channel.channel_points_custom_reward_redemption.add", { user_name: "dozer", reward: { cost: 500, title: "Trinken" }, user_input: "" }),
  { kind: "redeem", user: "dozer", amount: 500, detail: "Trinken", text: undefined });
assert.deepEqual(toAlert("channel.hype_train.begin", { level: 2 }), { kind: "hype", user: "HYPE TRAIN", amount: 2, detail: "begin" });
assert.deepEqual(toAlert("channel.hype_train.end", { level: 3 }), { kind: "hype", user: "HYPE TRAIN", amount: 3, detail: "end" });
assert.equal(toAlert("channel.unknown", {}), null);

// Test alerts: one sample per kind, only known kinds (no keys from the prototype)
for (const [kind, alert] of Object.entries(SAMPLE_ALERTS)) assert.equal(alert.kind, kind);
assert.ok(isAlertKind("raid"));
assert.ok(!isAlertKind("constructor"));

// --- fake fetch: answer per URL prefix, every request is recorded ---
type Answer = { status: number; body?: unknown };
let answers: Record<string, Answer[]> = {};
const requests: { url: string; method: string; body: string }[] = [];
globalThis.fetch = ((url: string, init?: RequestInit) => {
  const body = init?.body instanceof URLSearchParams ? init.body.toString() : typeof init?.body === "string" ? init.body : "";
  requests.push({ url, method: init?.method ?? "GET", body });
  const prefix = Object.keys(answers).find(start => url.startsWith(start));
  const answer = prefix ? answers[prefix].shift() : undefined;
  if (!answer) return Promise.reject(new Error(`unexpected request ${url}`));
  return Promise.resolve(new Response(JSON.stringify(answer.body ?? {}), { status: answer.status }));
}) as typeof fetch;

const app = twitchApp("client-id", "client-secret", "http://localhost:8089/auth/callback");

// Login URL with redirect, scopes and state
const authorize = new URL(app.authorizeUrl("state-1"));
assert.equal(authorize.searchParams.get("state"), "state-1");
assert.equal(authorize.searchParams.get("redirect_uri"), "http://localhost:8089/auth/callback");
assert.match(authorize.searchParams.get("scope") ?? "", /channel:read:subscriptions/);
assert.match(authorize.searchParams.get("scope") ?? "", /user:write:chat/);

// URLs from the environment: without variables real Twitch, otherwise the given URL (fake provider of the contract tests)
assert.equal(authorize.origin + authorize.pathname, "https://id.twitch.tv/oauth2/authorize");
const faked = twitchApp("client-id", "client-secret", "http://localhost:8089/auth/callback", providerUrls({ TWITCH_ID_URL: "http://127.0.0.1:1/oauth2/" }));
assert.ok(faked.authorizeUrl("s").startsWith("http://127.0.0.1:1/oauth2/authorize?"));
assert.equal(faked.urls.twitchApi, "https://api.twitch.tv/helix");

// exchange: exchange the code for tokens, fetch the login; invalid code = null, server errors throw
answers = {
  "https://id.twitch.tv/oauth2/token": [{ status: 200, body: { access_token: "access-2", refresh_token: "refresh-2" } }, { status: 400 }, { status: 500 }],
  "https://api.twitch.tv/helix/users": [{ status: 200, body: { data: [{ id: "42", login: "rezondes" }] } }],
};
assert.deepEqual(await app.exchange("code"), { access: "access-2", refresh: "refresh-2", userId: "42", login: "rezondes" });
assert.equal(await app.exchange("wrong"), null);
await assert.rejects(app.exchange("code"));

// validate: valid = same tokens, expired = renewed, refresh rejected = null, other errors throw
answers = {
  "https://id.twitch.tv/oauth2/validate": [{ status: 200 }, { status: 401 }, { status: 401 }, { status: 503 }],
  "https://id.twitch.tv/oauth2/token": [{ status: 200, body: { access_token: "access-3", refresh_token: "refresh-3" } }, { status: 400 }],
};
assert.equal(await app.validate(tokens), tokens);
assert.deepEqual(await app.validate(tokens), { ...tokens, access: "access-3", refresh: "refresh-3" });
assert.equal(await app.validate(tokens), null);
await assert.rejects(app.validate(tokens));

// canChat: does the login have the scope to write in chat (old logins before the scope do not); error = unknown
answers = { "https://id.twitch.tv/oauth2/validate": [{ status: 200, body: { scopes: ["bits:read", "user:write:chat"] } }, { status: 200, body: { scopes: ["bits:read"] } }, { status: 500 }] };
assert.equal(await app.canChat(tokens), true);
assert.equal(await app.canChat(tokens), false);
assert.equal(await app.canChat(tokens), null);

// say: message as the streamer in their own chat; ok, missing scope or error
answers = { "https://api.twitch.tv/helix/chat/messages": [{ status: 200 }, { status: 403 }, { status: 401 }, { status: 500 }] };
assert.equal(await app.say(tokens, "hello"), "ok");
assert.deepEqual(JSON.parse(requests.at(-1)!.body), { broadcaster_id: "42", sender_id: "42", message: "hello" });
assert.equal(await app.say(tokens, "hello"), "missing-scope");
assert.equal(await app.say(tokens, "hello"), "missing-scope");
await assert.rejects(app.say(tokens, "hello"));

// revoke: errors throw so the caller logs them
answers = { "https://id.twitch.tv/oauth2/revoke": [{ status: 200 }, { status: 400 }] };
await app.revoke("access-1");
await assert.rejects(app.revoke("access-1"));

// --- fake WebSocket ---
class FakeSocket {
  static opened: FakeSocket[] = [];
  url: string;
  closed = false;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  constructor(url: string) {
    this.url = url;
    FakeSocket.opened.push(this);
  }
  close() {
    this.closed = true;
    this.onclose?.();
  }
  receive(message: object) {
    this.onmessage?.({ data: JSON.stringify(message) });
  }
}
globalThis.WebSocket = FakeSocket as unknown as typeof WebSocket;
// Let all pending promises (subscriptions) run
const settle = () => new Promise(resolve => setImmediate(resolve));
mock.timers.enable({ apis: ["setTimeout"] });

const alerts: Alert[] = [];
let valid: TwitchTokens | null = tokens;
let offline = 0;
const events = eventSub(app, () => Promise.resolve(valid), alert => alerts.push(alert), () => { offline += 1; });
const welcome = (id: string) => ({ metadata: { message_type: "session_welcome" }, payload: { session: { id, keepalive_timeout_seconds: 10 } } });

// Start: connection, after session_welcome live and all 10 subscriptions requested for the session
answers = { "https://api.twitch.tv/helix/eventsub/subscriptions": Array.from({ length: 10 }, () => ({ status: 202 })) };
requests.length = 0;
events.start();
assert.equal(events.live(), false);
const first = FakeSocket.opened[0];
assert.equal(first.url, "wss://eventsub.wss.twitch.tv/ws");
first.receive(welcome("session-1"));
await settle();
assert.equal(events.live(), true);
assert.equal(requests.length, 10);
assert.match(requests[0].body, /"session_id":"session-1"/);
assert.ok(requests.some(request => request.body.includes('"type":"stream.offline"')));

// A notification becomes an alert; broken messages and revocations do not disturb
first.receive({ metadata: { message_type: "notification", subscription_type: "channel.follow" }, payload: { event: { user_name: "neo" } } });
first.onmessage?.({ data: "not json" });
first.receive({ metadata: { message_type: "revocation" }, payload: { subscription: { type: "channel.cheer", status: "authorization_revoked" } } });
assert.deepEqual(alerts, [{ kind: "follow", user: "neo" }]);

// Stream ended: no alert, but the offline callback
first.receive({ metadata: { message_type: "notification", subscription_type: "stream.offline" }, payload: { event: {} } });
assert.equal(offline, 1);
assert.equal(alerts.length, 1);

// session_reconnect: new connection to the Twitch URL without new subscriptions, the old one is closed; foreign URLs do not count
first.receive({ metadata: { message_type: "session_reconnect" }, payload: { session: { reconnect_url: "wss://evil.example/ws" } } });
assert.equal(FakeSocket.opened.length, 1);
first.receive({ metadata: { message_type: "session_reconnect" }, payload: { session: { reconnect_url: "wss://eventsub.wss.twitch.tv/ws?id=2" } } });
const second = FakeSocket.opened[1];
second.receive(welcome("session-2"));
await settle();
assert.ok(first.closed);
assert.equal(requests.length, 10);

// If keepalives stop, the connection is closed and rebuilt after a pause
mock.timers.tick(15_000);
assert.ok(second.closed);
assert.equal(events.live(), false);
mock.timers.tick(5000);
assert.equal(FakeSocket.opened.length, 3);

// Invalid login on subscribe: no subscriptions
valid = null;
FakeSocket.opened[2].receive(welcome("session-3"));
await settle();
assert.equal(requests.length, 10);

// stop: closes and schedules no retry
events.stop();
assert.ok(FakeSocket.opened[2].closed);
mock.timers.tick(10_000);
assert.equal(FakeSocket.opened.length, 3);
mock.timers.reset();

console.log("twitch ok");
