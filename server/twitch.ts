// Twitch für den Server: OAuth-App (Anmeldung, Token-Prüfung mit Erneuerung, Widerruf), Übersetzung der
// EventSub-Ereignisse in Alerts und die EventSub-Verbindung eines Streamers. Netzwerk nur über fetch und WebSocket.
// Check: twitch.check.ts (mit nachgebautem fetch und WebSocket, ohne Netz).
import type { Alert, AlertKind } from "../src/core/types.ts";
import { isLogin } from "../src/core/streamerPath.ts";

export type TwitchTokens = { access: string; refresh: string; userId: string; login: string };

const ID_URL = "https://id.twitch.tv/oauth2";
const HELIX_URL = "https://api.twitch.tv/helix";
const EVENTSUB_URL = "wss://eventsub.wss.twitch.tv/ws";
const SCOPES = ["moderator:read:followers", "channel:read:subscriptions", "bits:read", "channel:read:redemptions", "channel:read:hype_train"];

// Nur bekannte Felder mit gültigen Werten (Regel 25), sonst null. Für tokens.json und Antworten von Twitch.
export function toTokens(value: unknown): TwitchTokens | null {
  if (typeof value !== "object" || value === null) return null;
  const { access, refresh, userId, login } = value as Record<string, unknown>;
  if (typeof access !== "string" || !access || typeof refresh !== "string" || !refresh) return null;
  if (typeof userId !== "string" || !/^\d{1,20}$/.test(userId) || typeof login !== "string" || !isLogin(login)) return null;
  return { access, refresh, userId, login };
}

type TokenAnswer = { access_token?: string; refresh_token?: string };

// Token-Endpunkt. null = Code oder Refresh-Token ungültig (400, 401); andere Fehler werfen, damit ein
// Netzwerkproblem nie einen gültigen Login löscht.
async function requestToken(clientId: string, clientSecret: string, params: Record<string, string>): Promise<TokenAnswer | null> {
  const response = await fetch(`${ID_URL}/token`, { method: "POST", body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...params }) });
  if (response.status === 400 || response.status === 401) return null;
  if (!response.ok) throw new Error(`Twitch token request failed: ${response.status}`);
  return (await response.json()) as TokenAnswer;
}

// Die OAuth-App des Servers. redirectUri: PUBLIC_URL/auth/callback (wie in der Twitch-Konsole eingetragen).
export function twitchApp(clientId: string, clientSecret: string, redirectUri: string) {
  return {
    clientId,

    authorizeUrl(state: string) {
      const query = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: "code", scope: SCOPES.join(" "), state, force_verify: "true" });
      return `${ID_URL}/authorize?${query}`;
    },

    // Code aus dem Callback gegen Tokens tauschen und den Login dazu holen. null = Code ungültig.
    async exchange(code: string): Promise<TwitchTokens | null> {
      const answer = await requestToken(clientId, clientSecret, { grant_type: "authorization_code", code, redirect_uri: redirectUri });
      if (!answer) return null;
      const response = await fetch(`${HELIX_URL}/users`, { headers: { "Client-Id": clientId, Authorization: `Bearer ${answer.access_token}` } });
      if (!response.ok) throw new Error(`Twitch user request failed: ${response.status}`);
      const user = ((await response.json()) as { data?: { id?: string; login?: string }[] }).data?.[0];
      return toTokens({ access: answer.access_token, refresh: answer.refresh_token, userId: user?.id, login: user?.login });
    },

    // Twitch verlangt eine regelmässige Prüfung. Abgelaufen: mit dem Refresh-Token erneuern.
    // Liefert die gültigen (gleichen oder neuen) Tokens, null = Login ungültig. Netzwerkfehler werfen.
    async validate(tokens: TwitchTokens): Promise<TwitchTokens | null> {
      const response = await fetch(`${ID_URL}/validate`, { headers: { Authorization: `OAuth ${tokens.access}` } });
      if (response.ok) return tokens;
      if (response.status !== 401) throw new Error(`Twitch token validation failed: ${response.status}`);
      const answer = await requestToken(clientId, clientSecret, { grant_type: "refresh_token", refresh_token: tokens.refresh });
      return answer ? toTokens({ ...tokens, access: answer.access_token, refresh: answer.refresh_token ?? tokens.refresh }) : null;
    },

    // Token bei Twitch ungültig machen (Trennen, nicht freigeschaltet)
    async revoke(access: string) {
      const response = await fetch(`${ID_URL}/revoke`, { method: "POST", body: new URLSearchParams({ client_id: clientId, token: access }) });
      if (!response.ok) throw new Error(`Twitch revoke failed: ${response.status}`);
    },
  };
}
export type TwitchApp = ReturnType<typeof twitchApp>;

// --- Alerts ---------------------------------------------------------------------------------

// Die Felder der EventSub-Ereignisse, die toAlert liest (alle optional, Twitch schickt je nach Typ andere)
export type TwitchEvent = {
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

// Übersetzt ein EventSub-Ereignis in das Alert-Format der Overlays; null = kein Alert
export function toAlert(type: string, event: TwitchEvent): Alert | null {
  const user = event.user_name ?? "";
  // Geschenke und Bits dürfen anonym sein
  const giver = event.is_anonymous || !user ? "Anonym" : user;
  switch (type) {
    case "channel.follow": return { kind: "follow", user };
    // Verschenkte Subs meldet schon channel.subscription.gift, sonst gäbe es pro Empfänger einen Alert
    case "channel.subscribe": return event.is_gift ? null : { kind: "sub", user, detail: tier(event) };
    case "channel.subscription.message": return { kind: "resub", user, amount: event.cumulative_months, text: messageText(event) || undefined, detail: tier(event) };
    case "channel.subscription.gift": return { kind: "gift", user: giver, amount: event.total };
    // Cheermotes wie "Cheer100" aus dem Text nehmen
    case "channel.cheer": return { kind: "cheer", user: giver, amount: event.bits, text: messageText(event).replace(/\b[a-zA-Z]+\d+\b/g, "").trim() || undefined };
    case "channel.raid": return { kind: "raid", user: event.from_broadcaster_user_name ?? "", amount: event.viewers };
    case "channel.channel_points_custom_reward_redemption.add": return { kind: "redeem", user, amount: event.reward?.cost, detail: event.reward?.title, text: event.user_input || undefined };
    case "channel.hype_train.begin": return { kind: "hype", user: "HYPE TRAIN", amount: event.level, detail: "begin" };
    case "channel.hype_train.end": return { kind: "hype", user: "HYPE TRAIN", amount: event.level, detail: "end" };
  }
  return null;
}

// Beispiel-Alerts für die Test-Knöpfe im Dashboard, einer pro Art
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

// Abos eines Kanals: Typ, Version und Bedingung, wie Twitch sie verlangt
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
    // Stream beendet (z.B. Minimes leeren), braucht keinen Scope
    { type: "stream.offline", version: "1", condition: broadcaster },
  ];
}

// Die Felder der EventSub-Nachrichten, die hier gelesen werden
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
  socket: WebSocket | null; // aktive Verbindung (nach session_welcome)
  wanted: boolean;
  keepalive?: ReturnType<typeof setTimeout>;
  retry?: ReturnType<typeof setTimeout>;
};

// EventSub-Verbindung eines Streamers. tokens liefert gültige (geprüfte, evtl. erneuerte) Tokens oder null.
// live: verbunden und Abos angefragt. stop beendet die Verbindung und jeden geplanten Neuversuch.
// onOffline: der Stream wurde beendet (stream.offline).
export function eventSub(app: TwitchApp, tokens: () => Promise<TwitchTokens | null>, onAlert: (alert: Alert) => void, onOffline: () => void = () => {}) {
  const connection: Connection = { app, tokens, onAlert, onOffline, socket: null, wanted: false };
  return {
    start() {
      connection.wanted = true;
      open(connection, EVENTSUB_URL, true);
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
    // Twitch schickt regelmässig Keepalives. Bleiben sie aus, ist die Verbindung tot.
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
    // Neuer Versuch mit Pause (Regel 33), stop() löscht ihn
    connection.retry = setTimeout(() => open(connection, EVENTSUB_URL, true), 5000);
  };
}

function parseMessage(text: string): EventSubMessage {
  try {
    return JSON.parse(text) as EventSubMessage;
  } catch {
    // Kein JSON: wie eine leere Nachricht behandeln, zählt trotzdem als Lebenszeichen
    return {};
  }
}

function welcome(connection: Connection, socket: WebSocket, message: EventSubMessage, subscribe: boolean) {
  const old = connection.socket;
  connection.socket = socket;
  if (old && old !== socket) old.close();
  const sessionId = message.payload?.session?.id;
  // Nach session_reconnect bleiben die Abos bestehen
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
    const response = await fetch(`${HELIX_URL}/eventsub/subscriptions`, {
      method: "POST",
      headers: { "Client-Id": connection.app.clientId, Authorization: `Bearer ${tokens.access}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...subscription, transport: { method: "websocket", session_id: sessionId } }),
    });
    if (!response.ok) console.error(`EventSub subscription ${subscription.type} for ${tokens.login} failed: ${response.status} ${await response.text()}`);
  }
  console.log(`EventSub connected as ${tokens.login}`);
}
