// Keeps the Twitch tokens of a streamer current: checks them hourly and before every use, saves renewed ones.
// Simultaneous checks share one request: two parallel renewals with the same refresh token would make the
// second one fail, and that would look like a rejected login.
// After stop() (e.g. disconnect) a still running check saves nothing; new tokens from it are revoked.
// onInvalid: Twitch rejected the login.
import type { TwitchApp, TwitchTokens } from "./twitch.ts";

type KeeperSetup = {
  login: string;
  tokens: TwitchTokens;
  twitch: Pick<TwitchApp, "validate" | "revoke">;
  save: (tokens: TwitchTokens) => Promise<void>;
};

// fixed: Twitch requires an hourly check
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
    // Waits for a running check (including its save), afterwards tokens.json no longer changes
    idle: () => (inFlight ?? Promise.resolve(null)).then(() => {}, () => {}),
  };
}
