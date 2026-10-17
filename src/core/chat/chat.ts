// Context chat: display of the badges. The badges come as HOST, MOD, VIP, SUB from the server; a theme can
// have texts for them (badgeFields: badgeHost, badgeMod, badgeVip, badgeSub), otherwise the abbreviation stays.
// Pure; check: chat.check.ts.
import { text } from "../fields.ts";

const KEYS: Record<string, string> = { HOST: "badgeHost", MOD: "badgeMod", VIP: "badgeVip", SUB: "badgeSub" };

// Keys of the badge texts; count as used in the schema check
export const BADGE_KEYS = Object.values(KEYS);

// Fields for the badge texts, for themes that label badges
export const badgeFields = (group: string) => [
  text("badgeHost", "Badge Streamer", group, "HOST", 20),
  text("badgeMod", "Badge Moderator", group, "MOD", 20),
  text("badgeVip", "Badge VIP", group, "VIP", 20),
  text("badgeSub", "Badge Abonnent", group, "SUB", 20),
] as const;

export function badgeLabel(badge: string, values: Record<string, unknown>) {
  const text = KEYS[badge] ? values[KEYS[badge]] : undefined;
  return typeof text === "string" && text ? text : badge;
}
