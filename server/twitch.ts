// Twitch for the server: OAuth app (login, token check with renewal, revocation), translation of the
// EventSub events into alerts and the EventSub connection of a streamer. Network only via fetch and WebSocket.
// Check: twitch.check.ts (with fake fetch and WebSocket, without network).
import type { Alert, AlertKind } from "../src/core/types.ts";
import { isLogin } from "../src/core/streamerPath.ts";
import { REAL_PROVIDERS, type ProviderUrls } from "./providers.ts";

export type TwitchTokens = { access: string; refresh: string; userId: string; login: string };

// user:write:chat: reply to the help command as the streamer in their own chat
const CHAT_SCOPE = "user:write:chat";
const SCOPES = ["moderator:read:followers", "channel:read:subscriptions", "bits:read", "channel:read:redemptions", "channel:read:hype_train", CHAT_SCOPE];

// Only known fields with valid values (rule 25), otherwise null. For tokens.json and answers from Twitch.
export function toTokens(value: unknown): TwitchTokens | null {
  if (typeof value !== "object" || value === null) return null;
  const { access, refresh, userId, login } = value as Record<string, unknown>;
  if (typeof access !== "string" || !access || typeof refresh !== "string" || !refresh) return null;
  if (typeof userId !== "string" || !/^\d{1,20}$/.test(userId) || typeof login !== "string" || !isLogin(login)) return null;
  return { access, refresh, userId, login };
}

type TokenAnswer = { access_token?: string; refresh_token?: string };

// Token endpoint. null = code or refresh token invalid (400, 401); other errors throw, so a
// network problem never deletes a valid login.
async function requestToken(idUrl: string, clientId: string, clientSecret: string, params: Record<string, string>): Promise<TokenAnswer | null> {
  const response = await fetch(`${idUrl}/token`, { method: "POST", body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...params }) });
  if (response.status === 400 || response.status === 401) return null;
  if (!response.ok) throw new Error(`Twitch token request failed: ${response.status}`);
  return (await response.json()) as TokenAnswer;
}

// The OAuth app of the server. redirectUri: PUBLIC_URL/auth/callback (as entered in the Twitch console).
export function twitchApp(clientId: string, clientSecret: string, redirectUri: string, urls: ProviderUrls = REAL_PROVIDERS) {
  const idUrl = urls.twitchId;
  const helixUrl = urls.twitchApi;
  return {
    clientId,
    urls,

    authorizeUrl(state: string) {
      const query = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: "code", scope: SCOPES.join(" "), state, force_verify: "true" });
      return `${idUrl}/authorize?${query}`;
    },

    // Exchange the code from the callback for tokens and fetch the login. null = code invalid.
    async exchange(code: string): Promise<TwitchTokens | null> {
      const answer = await requestToken(idUrl, clientId, clientSecret, { grant_type: "authorization_code", code, redirect_uri: redirectUri });
      if (!answer) return null;
      const response = await fetch(`${helixUrl}/users`, { headers: { "Client-Id": clientId, Authorization: `Bearer ${answer.access_token}` } });
      if (!response.ok) throw new Error(`Twitch user request failed: ${response.status}`);
      const user = ((await response.json()) as { data?: { id?: string; login?: string }[] }).data?.[0];
      return toTokens({ access: answer.access_token, refresh: answer.refresh_token, userId: user?.id, login: user?.login });
    },

    // Twitch requires a regular check. Expired: renew with the refresh token.
    // Returns the valid (same or new) tokens, null = login invalid. Network errors throw.
    async validate(tokens: TwitchTokens): Promise<TwitchTokens | null> {
      const response = await fetch(`${idUrl}/validate`, { headers: { Authorization: `OAuth ${tokens.access}` } });
      if (response.ok) return tokens;
      if (response.status !== 401) throw new Error(`Twitch token validation failed: ${response.status}`);
      const answer = await requestToken(idUrl, clientId, clientSecret, { grant_type: "refresh_token", refresh_token: tokens.refresh });
      return answer ? toTokens({ ...tokens, access: answer.access_token, refresh: answer.refresh_token ?? tokens.refresh }) : null;
    },

    // May the login write to chat? Logins from before the scope may not; null = Twitch unreachable
    async canChat(tokens: TwitchTokens): Promise<boolean | null> {
      const response = await fetch(`${idUrl}/validate`, { headers: { Authorization: `OAuth ${tokens.access}` } }).catch(() => null);
      if (!response?.ok) return null;
      return ((await response.json()) as { scopes?: string[] }).scopes?.includes(CHAT_SCOPE) ?? false;
    },

    // Message as the streamer in their own chat; missing-scope = login without write permission (reconnect), other errors throw
    async say(tokens: TwitchTokens, message: string): Promise<"ok" | "missing-scope"> {
      const response = await fetch(`${helixUrl}/chat/messages`, {
        method: "POST",
        headers: { "Client-Id": clientId, Authorization: `Bearer ${tokens.access}`, "Content-Type": "application/json" },
        body: JSON.stringify({ broadcaster_id: tokens.userId, sender_id: tokens.userId, message }),
      });
      if (response.status === 401 || response.status === 403) return "missing-scope";
      if (!response.ok) throw new Error(`Twitch chat message failed: ${response.status}`);
      return "ok";
    },

    // Invalidate the token at Twitch (disconnect, not enabled)
    async revoke(access: string) {
      const response = await fetch(`${idUrl}/revoke`, { method: "POST", body: new URLSearchParams({ client_id: clientId, token: access }) });
      if (!response.ok) throw new Error(`Twitch revoke failed: ${response.status}`);
    },
  };
}
export type TwitchApp = ReturnType<typeof twitchApp>;

// --- Alerts ---------------------------------------------------------------------------------

// The fields of the EventSub events that toAlert reads (all optional, Twitch sends different ones per type)
type TwitchEvent = {
  user_name?: string | null;
  is_anonymous?: boolean;
  is_gift?: boolean;
  tier?: string;
  cumulative_months?: number;
  message?: string | { text?: string };
  total?: number;
  bits?: number;
  from_broadcaster_user_name?: string;
  viewers?: number;
  reward?: { cost?: number; title?: string };
  user_input?: string;
  level?: number;
};

const TIERS: Record<string, string> = { "2000": "Tier 2", "3000": "Tier 3" };
const tier = (event: TwitchEvent) => (event.tier && Object.hasOwn(TIERS, event.tier) ? TIERS[event.tier] : undefined);
const messageText = (event: TwitchEvent) => (typeof event.message === "string" ? event.message : event.message?.text ?? "");

// Translates an EventSub event into the alert format of the overlays; null = no alert
export function toAlert(type: string, event: TwitchEvent): Alert | null {
  const user = event.user_name ?? "";
  // Gifts and bits may be anonymous
  const giver = event.is_anonymous || !user ? "Anonym" : user;
  switch (type) {
    case "channel.follow": return { kind: "follow", user };
    // channel.subscription.gift already reports gifted subs, otherwise there would be one alert per recipient
    case "channel.subscribe": return event.is_gift ? null : { kind: "sub", user, detail: tier(event) };
    case "channel.subscription.message": return { kind: "resub", user, amount: event.cumulative_months, text: messageText(event) || undefined, detail: tier(event) };
    case "channel.subscription.gift": return { kind: "gift", user: giver, amount: event.total };
    // Remove cheermotes like "Cheer100" from the text
    case "channel.cheer": return { kind: "cheer", user: giver, amount: event.bits, text: messageText(event).replace(/\b[a-zA-Z]+\d+\b/g, "").trim() || undefined };
    case "channel.raid": return { kind: "raid", user: event.from_broadcaster_user_name ?? "", amount: event.viewers };
    case "channel.channel_points_custom_reward_redemption.add": return { kind: "redeem", user, amount: event.reward?.cost, detail: event.reward?.title, text: event.user_input || undefined };
    case "channel.hype_train.begin": return { kind: "hype", user: "HYPE TRAIN", amount: event.level, detail: "begin" };
    case "channel.hype_train.end": return { kind: "hype", user: "HYPE TRAIN", amount: event.level, detail: "end" };
  }
  return null;
}

// Sample alerts for the test buttons in the dashboard, one per kind
export const SAMPLE_ALERTS: Record<AlertKind, Alert> = {
  follow: { kind: "follow", user: "neo_42" },
  sub: { kind: "sub", user: "Trinity", text: "Endlich abonniert!" },
  resub: { kind: "resub", user: "MorpheusTV", amount: 12, text: "Ein Jahr schon!", detail: "Tier 2" },
  gift: { kind: "gift", user: "Oracle", amount: 5 },
  cheer: { kind: "cheer", user: "Tank", amount: 500, text: "Nimm das!" },
  raid: { kind: "raid", user: "agent_smith", amount: 42 },
  redeem: { kind: "redeem", user: "Dozer", amount: 500, detail: "Hydrieren!", text: "Trink was!" },
  hype: { kind: "hype", user: "HYPE TRAIN", amount: 3, detail: "end" },
};

export const isAlertKind = (value: string): value is AlertKind => Object.hasOwn(SAMPLE_ALERTS, value);

// --- EventSub ---------------------------------------------------------------------------------

// Subscriptions of a channel: type, version and condition as Twitch requires them
function subscriptions(userId: string) {
  const broadcaster = { broadcaster_user_id: userId };
  return [
    { type: "channel.follow", version: "2", condition: { broadcaster_user_id: userId, moderator_user_id: userId } },
    { type: "channel.subscribe", version: "1", condition: broadcaster },
    { type: "channel.subscription.message", version: "1", condition: broadcaster },
    { type: "channel.subscription.gift", version: "1", condition: broadcaster },
    { type: "channel.cheer", version: "1", condition: broadcaster },
    { type: "channel.raid", version: "1", condition: { to_broadcaster_user_id: userId } },
    { type: "channel.channel_points_custom_reward_redemption.add", version: "1", condition: broadcaster },
    { type: "channel.hype_train.begin", version: "2", condition: broadcaster },
    { type: "channel.hype_train.end", version: "2", condition: broadcaster },
    // Stream ended (e.g. clear minimes), needs no scope
    { type: "stream.offline", version: "1", condition: broadcaster },
  ];
}

// The fields of the EventSub messages that are read here
type EventSubMessage = {
  metadata?: { message_type?: string; subscription_type?: string };
  payload?: {
    session?: { id?: string; keepalive_timeout_seconds?: number | null; reconnect_url?: string | null };
    subscription?: { type?: string; status?: string };
    event?: TwitchEvent;
  };
};

type Connection = {
  app: TwitchApp;
  tokens: () => Promise<TwitchTokens | null>;
  onAlert: (alert: Alert) => void;
  onOffline: () => void;
  socket: WebSocket | null; // active connection (after session_welcome)
  wanted: boolean;
  keepalive?: ReturnType<typeof setTimeout>;
  retry?: ReturnType<typeof setTimeout>;
};

// EventSub connection of a streamer. tokens returns valid (checked, possibly renewed) tokens or null.
// live: connected and subscriptions requested. stop ends the connection and every scheduled retry.
// onOffline: the stream ended (stream.offline).
export function eventSub(app: TwitchApp, tokens: () => Promise<TwitchTokens | null>, onAlert: (alert: Alert) => void, onOffline: () => void = () => {}) {
  const connection: Connection = { app, tokens, onAlert, onOffline, socket: null, wanted: false };
  return {
    start() {
      connection.wanted = true;
      open(connection, connection.app.urls.twitchEventSub, true);
    },
    stop() {
      connection.wanted = false;
      clearTimeout(connection.keepalive);
      clearTimeout(connection.retry);
      const old = connection.socket;
      connection.socket = null;
      old?.close();
    },
    live: () => connection.socket !== null,
  };
}

function open(connection: Connection, url: string, subscribe: boolean) {
  const socket = new WebSocket(url);
  let timeoutMs = 30_000;
  socket.onmessage = event => {
    const message = parseMessage(String(event.data));
    if (message.metadata?.message_type === "session_welcome") {
      timeoutMs = (message.payload?.session?.keepalive_timeout_seconds ?? 30) * 1000;
      welcome(connection, socket, message, subscribe);
    } else {
      dispatch(connection, message);
    }
    // Twitch sends keepalives regularly. If they stop, the connection is dead.
    if (socket === connection.socket) {
      clearTimeout(connection.keepalive);
      connection.keepalive = setTimeout(() => socket.close(), timeoutMs + 5000);
    }
  };
  socket.onclose = () => {
    if (!connection.wanted || (socket !== connection.socket && connection.socket !== null)) return;
    connection.socket = null;
    clearTimeout(connection.keepalive);
    clearTimeout(connection.retry);
    // New attempt after a pause (rule 33), stop() clears it
    connection.retry = setTimeout(() => open(connection, connection.app.urls.twitchEventSub, true), 5000);
  };
}

function parseMessage(text: string): EventSubMessage {
  try {
    return JSON.parse(text) as EventSubMessage;
  } catch {
    // Not JSON: treat like an empty message, still counts as a sign of life
    return {};
  }
}

function welcome(connection: Connection, socket: WebSocket, message: EventSubMessage, subscribe: boolean) {
  const old = connection.socket;
  connection.socket = socket;
  if (old && old !== socket) old.close();
  const sessionId = message.payload?.session?.id;
  // After session_reconnect the subscriptions stay in place
  if (!subscribe || !sessionId) return;
  subscribeAll(connection, sessionId).catch((error: unknown) => console.error("EventSub subscribing failed:", error));
}

function dispatch(connection: Connection, message: EventSubMessage) {
  const type = message.metadata?.message_type;
  const reconnectUrl = message.payload?.session?.reconnect_url;
  if (type === "notification" && message.metadata?.subscription_type === "stream.offline") {
    connection.onOffline();
  } else if (type === "notification") {
    const alert = toAlert(message.metadata?.subscription_type ?? "", message.payload?.event ?? {});
    if (alert) connection.onAlert(alert);
  } else if (type === "session_reconnect" && reconnectUrl && /^wss:\/\/[\w.-]+\.twitch\.tv\//.test(reconnectUrl)) {
    open(connection, reconnectUrl, false);
  } else if (type === "revocation") {
    console.warn(`EventSub subscription revoked: ${message.payload?.subscription?.type} (${message.payload?.subscription?.status})`);
  }
}

async function subscribeAll(connection: Connection, sessionId: string) {
  const tokens = await connection.tokens();
  if (!tokens) return;
  for (const subscription of subscriptions(tokens.userId)) {
    const response = await fetch(`${connection.app.urls.twitchApi}/eventsub/subscriptions`, {
      method: "POST",
      headers: { "Client-Id": connection.app.clientId, Authorization: `Bearer ${tokens.access}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...subscription, transport: { method: "websocket", session_id: sessionId } }),
    });
    if (!response.ok) console.error(`EventSub subscription ${subscription.type} for ${tokens.login} failed: ${response.status} ${await response.text()}`);
  }
  console.log(`EventSub connected as ${tokens.login}`);
}
