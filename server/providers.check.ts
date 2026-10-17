// Check für providers.ts: ohne Variablen die echten Adressen, gesetzte Variablen ohne / am Ende. Läuft mit npm test.
import assert from "node:assert/strict";
import { providerUrls, REAL_PROVIDERS } from "./providers.ts";

assert.deepEqual(providerUrls({}), REAL_PROVIDERS);
assert.equal(REAL_PROVIDERS.twitchId, "https://id.twitch.tv/oauth2");
assert.equal(providerUrls({ TWITCH_ID_URL: "http://127.0.0.1:1/oauth2/" }).twitchId, "http://127.0.0.1:1/oauth2");
assert.equal(providerUrls({ SPOTIFY_API_URL: " " }).spotifyApi, REAL_PROVIDERS.spotifyApi);
assert.equal(providerUrls({ TWITCH_IRC_URL: "ws://127.0.0.1:1/irc" }).twitchIrc, "ws://127.0.0.1:1/irc");

console.log("providers ok");
