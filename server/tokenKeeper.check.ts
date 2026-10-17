// Check für tokenKeeper.ts: gleichzeitige Prüfungen teilen sich eine Erneuerung, erneuerte Tokens werden gespeichert,
// ein abgelehnter Login meldet sich einmal. Läuft mit npm test.
import assert from "node:assert/strict";
import { tokenKeeper } from "./tokenKeeper.ts";
import type { TwitchTokens } from "./twitch.ts";

const old: TwitchTokens = { access: "a1", refresh: "r1", userId: "1", login: "neo" };
const fresh: TwitchTokens = { ...old, access: "a2", refresh: "r2" };

// Twitch nimmt jedes Refresh-Token nur einmal an: eine zweite Erneuerung mit r1 würde abgelehnt
let refreshes = 0;
let release: () => void = () => {};
const twitch = {
  async validate(tokens: TwitchTokens) {
    await new Promise<void>(resolve => { release = resolve; });
    if (tokens.refresh !== "r1") return tokens;
    refreshes++;
    return refreshes === 1 ? fresh : null;
  },
};
const saved: TwitchTokens[] = [];
let invalid = 0;
const keeper = tokenKeeper({ login: "neo", tokens: old, twitch, save: tokens => { saved.push(tokens); return Promise.resolve(); } }, () => { invalid++; return Promise.resolve(); }, 60_000);

// Zwei gleichzeitige Prüfungen (z.B. Hilfe-Befehl und EventSub): eine Anfrage, beide bekommen die neuen Tokens
const both = Promise.all([keeper.valid(), keeper.valid()]);
release();
assert.deepEqual(await both, [fresh, fresh]);
assert.equal(refreshes, 1);
assert.equal(invalid, 0);
assert.deepEqual(saved, [fresh]);
assert.equal(keeper.current(), fresh);

// Danach eine neue Prüfung mit den neuen Tokens
const again = keeper.valid();
release();
assert.equal(await again, fresh);

// Abgelehnter Login: onInvalid, null
const rejecting = tokenKeeper({ login: "neo", tokens: old, twitch: { validate: () => Promise.resolve(null) }, save: () => Promise.resolve() }, () => { invalid++; return Promise.resolve(); }, 60_000);
assert.equal(await rejecting.valid(), null);
assert.equal(invalid, 1);

keeper.stop();
rejecting.stop();
console.log("tokenKeeper ok");
