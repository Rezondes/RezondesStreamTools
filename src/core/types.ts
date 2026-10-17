// Shared data types of overlays, dashboard and server (types only, nothing at runtime).
// Field names go over the wire (SSE, JSON files) and therefore stay stable.
import type { Part } from "./irc.ts";
import type { SettingValues } from "./theme.ts";

export type ChatMessage = { id: string; login: string; user: string; badges: string[]; parts: Part[]; action: boolean };

export type AlertKind = "follow" | "sub" | "resub" | "gift" | "raid" | "cheer" | "redeem" | "hype";
// detail: sub tier (sub, resub), name of the reward (redeem), "begin" or "end" (hype)
export type Alert = { kind: AlertKind; user: string; amount?: number; text?: string; detail?: string };

// Current Spotify track. progressMs applies to the moment the message arrives.
export type Track = { id: string; title: string; artist: string; album: string; cover: string | null; durationMs: number; progressMs: number; playing: boolean };

// Chat trigger (triggers.json): what an effects overlay (fx.html) should do.
// position: "center", "random" or percent { x, y } of the overlay area. size: width in px.
export type FxPosition = "center" | "random" | { x: number; y: number };
export type FxAction = {
  type: "media" | "text";
  zone?: string;
  image?: string;
  video?: string;
  text?: string;
  sound?: string;
  volume?: number;
  duration?: number;
  // Ablauf in "do": Aktionen laufen nacheinander. delay = Sekunden sichtbar, aber angehalten (erstes Bild),
  // after = seconds standing paused (last frame), together = appears with the previous action
  delay?: number;
  after?: number;
  together?: boolean;
  position?: FxPosition;
  size?: number;
};
export type FxEvent = { id: number; zone: string; action: FxAction; user: string; message: string };

// Moderation: message deleted (id), user banned/timed out (login) or chat cleared (both empty)
export type ChatRemoval = { id?: string; login?: string };

// Answer of /s/<login>/status. spotify: null = not set up or feature off, otherwise whether it is connected.
// features: which features are on for the streamer (alerts, chat, music, fx, triggers, ...)
export type ServerStatus = { login: string; live: boolean; spotify: boolean | null; features: Record<string, boolean> };

// Answer of GET /api/spotify (connection page): connected account, current track, whether it is polling right now
// (which only happens while an overlay of the streamer is open)
export type SpotifyDetails = { account: string | null; track: Track | null; polling: boolean };

// Joined chatter as a figure in the scene minimes. color: #rrggbb or null = default color of the theme;
// variant: variant (e.g. "mango") in themes with variants, otherwise null
export type Minime = { login: string; user: string; color: string | null; variant: string | null };

// Messages from the server to the overlays (SSE), sent by server/streamer.ts.
// minimes: the whole current list; minimeChat: this chatter wrote (the theme reacts to it)
export type ServerMessage =
  | { type: "alert"; alert: Alert }
  | { type: "music"; track: Track | null }
  | { type: "fx"; event: FxEvent }
  | { type: "settings"; settings: PublicSettings }
  | { type: "minimes"; minimes: Minime[] }
  | { type: "minimeChat"; login: string };

// Chosen theme and its resolved settings (GET /s/<login>/settings and SSE "settings")
export type PublicSettings = { theme: string; values: SettingValues };
