// Translates a Twitch IRC line into events for the overlays: chat, alerts (subs, gifts, raids, bits),
// moderation deletions, room ID (for 7TV/BTTV/FFZ) and ping. Pure function, tested in ircEvents.check.ts.
import { splitEmotes, splitWords, type IrcMessage } from "./irc.ts";
import type { Alert, ChatMessage, ChatRemoval } from "./types.ts";

type IrcEvent =
  | { type: "chat"; message: ChatMessage }
  | { type: "alert"; alert: Alert }
  | { type: "remove"; removal: ChatRemoval }
  | { type: "room"; roomId: string }
  | { type: "ping"; token: string };

const BADGES: Record<string, string> = { broadcaster: "HOST", moderator: "MOD", vip: "VIP", subscriber: "SUB" };
const ACTION_MARK = String.fromCharCode(1);

// withAlerts: false when alerts come from the server (otherwise subs would appear twice). newId: for messages without id.
export function toIrcEvents(message: IrcMessage, emotes: Map<string, string>, withAlerts: boolean, newId: () => string): IrcEvent[] {
  const tags = message.tags;
  const user = tags["display-name"] || message.prefix.split("!")[0];
  switch (message.command) {
    case "PING": return [{ type: "ping", token: message.params[0] ?? "" }];
    case "PRIVMSG": return chatEvents(message, emotes, withAlerts, newId);
    case "USERNOTICE": {
      const alert = withAlerts ? noticeAlert(tags, user, message.params[1]) : null;
      return alert ? [{ type: "alert", alert }] : [];
    }
    case "CLEARMSG": return [{ type: "remove", removal: { id: tags["target-msg-id"] } }];
    case "CLEARCHAT": return [{ type: "remove", removal: message.params[1] ? { login: message.params[1] } : {} }];
    case "ROOMSTATE": return tags["room-id"] ? [{ type: "room", roomId: tags["room-id"] }] : [];
    default: return [];
  }
}

function chatEvents(message: IrcMessage, emotes: Map<string, string>, withAlerts: boolean, newId: () => string): IrcEvent[] {
  const tags = message.tags;
  const login = message.prefix.split("!")[0];
  const user = tags["display-name"] || login;
  let text = message.params[1] ?? "";
  // /me messages come as ACTION between two control characters
  const action = text.startsWith(`${ACTION_MARK}ACTION `) && text.endsWith(ACTION_MARK);
  if (action) text = text.slice(8, -1);
  const chat: IrcEvent = {
    type: "chat",
    message: {
      id: tags.id ?? newId(),
      login,
      user,
      badges: (tags.badges ?? "").split(",").map(badge => BADGES[badge.split("/")[0]]).filter(Boolean),
      parts: splitWords(splitEmotes(text, tags.emotes), emotes),
      action,
    },
  };
  if (!withAlerts || !tags.bits) return [chat];
  // Cheermotes like "Cheer100" do not belong in the alert text
  const cheerText = text.replace(/\b\w+\d+\b/g, "").trim();
  return [chat, { type: "alert", alert: { kind: "cheer", user, amount: Number(tags.bits), text: cheerText } }];
}

function noticeAlert(tags: Record<string, string>, user: string, text: string | undefined): Alert | null {
  switch (tags["msg-id"]) {
    case "sub": return { kind: "sub", user, text };
    case "resub": return { kind: "resub", user, amount: Number(tags["msg-param-cumulative-months"]), text };
    // Single gifts of a mass gifting carry community-gift-id, submysterygift already counts them
    case "subgift": return tags["msg-param-community-gift-id"] ? null : { kind: "gift", user, amount: 1, text: tags["msg-param-recipient-display-name"] };
    case "submysterygift": return { kind: "gift", user, amount: Number(tags["msg-param-mass-gift-count"]) };
    case "raid": return { kind: "raid", user: tags["msg-param-displayName"] || user, amount: Number(tags["msg-param-viewerCount"]) };
    default: return null;
  }
}
