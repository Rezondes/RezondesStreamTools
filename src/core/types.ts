// Shared data types of overlays, dashboard and server (types only, nothing at runtime). The wire types come from the
// Rust server (src/generated, npm run gen:types); only what the server builds by hand is described here.
export type { Alert } from "../generated/Alert.ts";
export type { AlertKind } from "../generated/AlertKind.ts";
export type { ChatMessage } from "../generated/ChatMessage.ts";
export type { ChatRemoval } from "../generated/ChatRemoval.ts";
export type { FxAction } from "../generated/FxAction.ts";
export type { FxEvent } from "../generated/FxEvent.ts";
export type { FxPosition } from "../generated/FxPosition.ts";
export type { Minime } from "../generated/Minime.ts";
export type { PublicSettings } from "../generated/PublicSettings.ts";
export type { ServerMessage } from "../generated/ServerMessage.ts";
export type { SpotifyDetails } from "../generated/SpotifyDetails.ts";
export type { StreamStats } from "../generated/StreamStats.ts";
export type { Track } from "../generated/Track.ts";

// Answer of /s/<login>/status. spotify: null = not set up or feature off, otherwise whether it is connected.
// features: which features are on for the streamer (alerts, chat, music, fx, triggers, ...); channelId: Twitch id of
// the channel for the emotes of 7TV, BTTV and FFZ (null without a running runtime, missing on the old server)
export type ServerStatus = { login: string; live: boolean; spotify: boolean | null; features: Record<string, boolean>; channelId?: string | null };
