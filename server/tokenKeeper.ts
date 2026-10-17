// Hält die Twitch-Tokens eines Streamers aktuell: prüft sie stündlich und vor jedem Gebrauch, speichert erneuerte.
// Gleichzeitige Prüfungen teilen sich eine Anfrage: zwei parallele Erneuerungen mit demselben Refresh-Token würden
// die zweite scheitern lassen, und das sähe aus wie ein abgelehnter Login.
// onInvalid: Twitch hat den Login abgelehnt.
import type { TwitchApp, TwitchTokens } from "./twitch.ts";

type KeeperSetup = {
  login: string;
  tokens: TwitchTokens;
  twitch: Pick<TwitchApp, "validate">;
  save: (tokens: TwitchTokens) => Promise<void>;
};

// fixed: Twitch verlangt eine stündliche Prüfung
const CHECK_MS = 3_600_000;

export function tokenKeeper(setup: KeeperSetup, onInvalid: () => Promise<void>, checkMs = CHECK_MS) {
  let tokens = setup.tokens;
  let inFlight: Promise<TwitchTokens | null> | null = null;

  async function check(): Promise<TwitchTokens | null> {
    const checked = await setup.twitch.validate(tokens);
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
  return { valid, current: () => tokens, stop: () => clearInterval(timer) };
}
