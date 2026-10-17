// Hält die Twitch-Tokens eines Streamers aktuell: prüft sie stündlich und vor jedem Gebrauch, speichert erneuerte.
// Gleichzeitige Prüfungen teilen sich eine Anfrage: zwei parallele Erneuerungen mit demselben Refresh-Token würden
// die zweite scheitern lassen, und das sähe aus wie ein abgelehnter Login.
// Nach stop() (z.B. Trennen) speichert eine noch laufende Prüfung nichts mehr; neue Tokens aus ihr werden widerrufen.
// onInvalid: Twitch hat den Login abgelehnt.
import type { TwitchApp, TwitchTokens } from "./twitch.ts";

type KeeperSetup = {
  login: string;
  tokens: TwitchTokens;
  twitch: Pick<TwitchApp, "validate" | "revoke">;
  save: (tokens: TwitchTokens) => Promise<void>;
};

// fixed: Twitch verlangt eine stündliche Prüfung
const CHECK_MS = 3_600_000;

export function tokenKeeper(setup: KeeperSetup, onInvalid: () => Promise<void>, checkMs = CHECK_MS) {
  let tokens = setup.tokens;
  let inFlight: Promise<TwitchTokens | null> | null = null;
  let stopped = false;

  async function check(): Promise<TwitchTokens | null> {
    const checked = await setup.twitch.validate(tokens);
    if (stopped) {
      if (checked && checked !== tokens) await setup.twitch.revoke(checked.access).catch(() => {});
      return null;
    }
    if (!checked) {
      await onInvalid();
      return null;
    }
    if (checked !== tokens) {
      tokens = checked;
      await setup.save(checked);
    }
    return checked;
  }

  function valid(): Promise<TwitchTokens | null> {
    inFlight ??= check().finally(() => { inFlight = null; });
    return inFlight;
  }

  const timer = setInterval(() => { valid().catch((error: unknown) => console.error(`Token check for ${setup.login} failed:`, error)); }, checkMs);
  return {
    valid,
    current: () => tokens,
    stop: () => { stopped = true; clearInterval(timer); },
    // Wartet auf eine laufende Prüfung (auch ihr Speichern), danach ändert sich tokens.json nicht mehr
    idle: () => (inFlight ?? Promise.resolve(null)).then(() => {}, () => {}),
  };
}
