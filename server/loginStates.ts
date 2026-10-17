// Offene OAuth-Anmeldungen (Twitch, Spotify): zufälliger state -> Wert (z.B. der Login), gültig für ttlMs.
// Der Callback löst den state genau einmal ein; so kann keine fremde Seite einen Login unterschieben.
// state und now kommen von aussen (Regel 32). Check: loginStates.check.ts.

import { timingSafeEqual } from "node:crypto";

// Der Callback gehört zum Browser, der die Anmeldung begonnen hat: der state steht dort auch im Cookie oauth_state.
// Sonst könnte ein Angreifer seinen eigenen Callback-Link unterschieben (Login-CSRF).
export function sameBrowser(cookieState: string | undefined, queryState: string) {
  if (!cookieState || !queryState) return false;
  const given = Buffer.from(cookieState);
  const expected = Buffer.from(queryState);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// ttlMs: Gültigkeit; limit: höchstens so viele offene Anmeldungen, die ältesten fallen zuerst weg
export function createLoginStates<Value>(ttlMs: number, limit: number) {
  const open = new Map<string, { value: Value; expiresAt: number }>();
  return {
    add(state: string, value: Value, now: number) {
      open.set(state, { value, expiresAt: now + ttlMs });
      // Viele Login-Klicks füllen so nie den Speicher
      for (const oldest of open.keys()) {
        if (open.size <= limit) break;
        open.delete(oldest);
      }
    },
    // Wert zum state; null, wenn unbekannt, schon eingelöst oder abgelaufen
    take(state: string, now: number): Value | null {
      const entry = open.get(state);
      open.delete(state);
      return entry && entry.expiresAt > now ? entry.value : null;
    },
  };
}
