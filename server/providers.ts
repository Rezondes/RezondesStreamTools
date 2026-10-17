// Base URLs of Twitch and Spotify. Without variables the real services; the contract tests (contract/) point them at
// the fake provider (contract/fakeProviders.ts). index.ts reads the environment and passes the result on.
import { IRC_URL } from "../src/core/irc.ts";

export type ProviderUrls = {
  twitchId: string;
  twitchApi: string;
  twitchEventSub: string;
  twitchIrc: string;
  spotifyAccounts: string;
  spotifyApi: string;
};

export const REAL_PROVIDERS: ProviderUrls = {
  twitchId: "https://id.twitch.tv/oauth2",
  twitchApi: "https://api.twitch.tv/helix",
  twitchEventSub: "wss://eventsub.wss.twitch.tv/ws",
  twitchIrc: IRC_URL,
  spotifyAccounts: "https://accounts.spotify.com",
  spotifyApi: "https://api.spotify.com/v1",
};

const strip = (url: string | undefined) => url?.trim().replace(/\/+$/, "") || undefined;

export function providerUrls(env: Record<string, string | undefined>): ProviderUrls {
  return {
    twitchId: strip(env.TWITCH_ID_URL) ?? REAL_PROVIDERS.twitchId,
    twitchApi: strip(env.TWITCH_API_URL) ?? REAL_PROVIDERS.twitchApi,
    twitchEventSub: strip(env.TWITCH_EVENTSUB_URL) ?? REAL_PROVIDERS.twitchEventSub,
    twitchIrc: strip(env.TWITCH_IRC_URL) ?? REAL_PROVIDERS.twitchIrc,
    spotifyAccounts: strip(env.SPOTIFY_ACCOUNTS_URL) ?? REAL_PROVIDERS.spotifyAccounts,
    spotifyApi: strip(env.SPOTIFY_API_URL) ?? REAL_PROVIDERS.spotifyApi,
  };
}
