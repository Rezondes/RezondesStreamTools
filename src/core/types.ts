// Gemeinsame Datentypen von Overlays, Dashboard und Server (nur Typen, nichts zur Laufzeit).
// Feldnamen gehen über die Leitung (SSE, JSON-Dateien) und bleiben darum stabil.
import type { Part } from "./irc.ts";
import type { SettingValues } from "./theme.ts";

export type ChatMessage = { id: string; login: string; user: string; badges: string[]; parts: Part[]; action: boolean };

export type AlertKind = "follow" | "sub" | "resub" | "gift" | "raid" | "cheer" | "redeem" | "hype";
// detail: Abo-Stufe (sub, resub), Name der Belohnung (redeem), "begin" oder "end" (hype)
export type Alert = { kind: AlertKind; user: string; amount?: number; text?: string; detail?: string };

// Laufender Spotify-Titel. progressMs gilt für den Moment, in dem die Nachricht ankommt.
export type Track = { id: string; title: string; artist: string; album: string; cover: string | null; durationMs: number; progressMs: number; playing: boolean };

// Chat-Trigger (triggers.json): was ein Effekt-Overlay (fx.html) tun soll.
// position: "center", "random" oder Prozent { x, y } der Overlay-Fläche. size: Breite in px.
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
  // after = Sekunden angehalten stehen bleiben (letztes Bild), together = erscheint mit der vorherigen Aktion
  delay?: number;
  after?: number;
  together?: boolean;
  position?: FxPosition;
  size?: number;
};
export type FxEvent = { id: number; zone: string; action: FxAction; user: string; message: string };

// Moderation: Nachricht gelöscht (id), Nutzer gebannt/getimeoutet (login) oder Chat geleert (beides leer)
export type ChatRemoval = { id?: string; login?: string };

// Antwort von /s/<login>/status. spotify: null = nicht eingerichtet oder Funktion aus, sonst ob verbunden.
// features: welche Funktionen für den Streamer an sind (alerts, chat, music, fx, triggers, ...)
export type ServerStatus = { login: string; live: boolean; spotify: boolean | null; features: Record<string, boolean> };

// Nachrichten vom Server an die Overlays (SSE), gesendet von server/streamer.ts
export type ServerMessage =
  | { type: "alert"; alert: Alert }
  | { type: "music"; track: Track | null }
  | { type: "fx"; event: FxEvent }
  | { type: "settings"; settings: PublicSettings };

// Gewähltes Theme und seine aufgelösten Einstellungen (GET /s/<login>/settings und SSE "settings")
export type PublicSettings = { theme: string; values: SettingValues };
