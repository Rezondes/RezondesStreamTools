// Pending OAuth logins (Twitch, Spotify): random state -> value (e.g. the login), valid for ttlMs.
// The callback redeems the state exactly once; this way no foreign page can slip in a login.
// state and now come from outside (rule 32). Check: loginStates.check.ts.

import { timingSafeEqual } from "node:crypto";

// The callback belongs to the browser that started the login: the state is also in its cookie oauth_state.
// Otherwise an attacker could slip in their own callback link (login CSRF).
export function sameBrowser(cookieState: string | undefined, queryState: string) {
  if (!cookieState || !queryState) return false;
  const given = Buffer.from(cookieState);
  const expected = Buffer.from(queryState);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// ttlMs: validity; limit: at most this many pending logins, the oldest drop out first
export function createLoginStates<Value>(ttlMs: number, limit: number) {
  const open = new Map<string, { value: Value; expiresAt: number }>();
  return {
    add(state: string, value: Value, now: number) {
      open.set(state, { value, expiresAt: now + ttlMs });
      // Many login clicks never fill up the memory this way
      for (const oldest of open.keys()) {
        if (open.size <= limit) break;
        open.delete(oldest);
      }
    },
    // Value for the state; null if unknown, already redeemed or expired
    take(state: string, now: number): Value | null {
      const entry = open.get(state);
      open.delete(state);
      return entry && entry.expiresAt > now ? entry.value : null;
    },
  };
}
