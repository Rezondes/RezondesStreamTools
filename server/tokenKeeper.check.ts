// Check for tokenKeeper.ts: simultaneous checks share one renewal, renewed tokens are saved,
// a rejected login reports once. Runs with npm test.
import assert from "node:assert/strict";
import { tokenKeeper } from "./tokenKeeper.ts";
import type { TwitchTokens } from "./twitch.ts";

const old: TwitchTokens = { access: "a1", refresh: "r1", userId: "1", login: "neo" };
const fresh: TwitchTokens = { ...old, access: "a2", refresh: "r2" };

// Twitch accepts every refresh token only once: a second renewal with r1 would be rejected
let refreshes = 0;
let release: () => void = () => {};
const revoked: string[] = [];
const twitch = {
  revoke(access: string) { revoked.push(access); return Promise.resolve(); },
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

// Two simultaneous checks (e.g. help command and EventSub): one request, both get the new tokens
const both = Promise.all([keeper.valid(), keeper.valid()]);
release();
assert.deepEqual(await both, [fresh, fresh]);
assert.equal(refreshes, 1);
assert.equal(invalid, 0);
assert.deepEqual(saved, [fresh]);
assert.equal(keeper.current(), fresh);

// Afterwards a new check with the new tokens
const again = keeper.valid();
release();
assert.equal(await again, fresh);

// Rejected login: onInvalid, null
const rejecting = tokenKeeper({ login: "neo", tokens: old, twitch: { ...twitch, validate: () => Promise.resolve(null) }, save: () => Promise.resolve() }, () => { invalid++; return Promise.resolve(); }, 60_000);
assert.equal(await rejecting.valid(), null);
assert.equal(invalid, 1);

keeper.stop();
rejecting.stop();

// Disconnect while a renewal runs: afterwards nothing is saved, onInvalid is not called and the new
// token is revoked right away (otherwise the check would create tokens.json again after the delete)
refreshes = 0;
saved.length = 0;
const stopping = tokenKeeper({ login: "neo", tokens: old, twitch, save: tokens => { saved.push(tokens); return Promise.resolve(); } }, () => { invalid++; return Promise.resolve(); }, 60_000);
const pending = stopping.valid();
stopping.stop();
const idle = stopping.idle();
release();
await idle;
assert.equal(await pending, null);
assert.deepEqual(saved, []);
assert.equal(invalid, 1);
assert.deepEqual(revoked, ["a2"]);
console.log("tokenKeeper ok");
