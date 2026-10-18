// Rules of the minimes (chatters as figures in the scene minimes) as the frontend reads them from the settings
// (minimeFields.ts) for the commands and info pages. Applying them (commands from chat, the list of joined chatters)
// happens only on the server, in Rust (rst-domain minimes).
// Check: minimes.check.ts.

// All settings that decide what the list does. Roles: Twitch badges (subscriber, vip, moderator,
// broadcaster) or everyone; the streamer (broadcaster) may always do everything. look: command for color or variant.
// variants: allowed variants with their names in chat (normalized, see normalizeName); null = the theme uses colors.
// teams and commands.team: factions and the command to choose one, missing = the theme has none.
export type MinimeRules = {
  commands: { join: string; look: string; leave: string; team?: string };
  joinRoles: readonly string[];
  kickRoles: readonly string[];
  colorJoins: boolean; // !color joins chatters who have not joined
  max: number;
  whenFull: "replace" | "reject"; // replace: the longest inactive one is removed
  idleMinutes: number; // 0 = never
  colorCooldownS: number;
  minBrightness: number; // 0 to 255, brightest channel of a color
  useTwitchColor: boolean;
  chatKeepsAlive: boolean;
  reactToChat: boolean;
  clearOffline: boolean; // evaluated by the server on stream.offline
  removeOnBan: boolean;
  variants: readonly MinimeVariantRule[] | null;
  teams?: readonly MinimeVariantRule[];
};
export type MinimeVariantRule = { id: string; names: readonly string[] };

const SPELLED: Record<string, string> = { "ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss" };

// Makes a name from chat or the settings comparable: lower case, ä/ö/ü/ß spelled out, without spaces and hyphens
// (the same as normalize_name on the server)
export function normalizeName(text: string): string {
  return text.toLowerCase().replace(/[äöüß]/g, letter => SPELLED[letter]).replace(/[\s-]+/g, "");
}
