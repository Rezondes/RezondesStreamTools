// Kontext Chat: Anzeige der Badges. Die Badges kommen als HOST, MOD, VIP, SUB aus core/ircEvents.ts; ein Theme kann
// dafür Texte haben (badgeFields: badgeHost, badgeMod, badgeVip, badgeSub), sonst bleibt das Kürzel.
// Rein; Check: chat.check.ts.
import { text } from "../fields.ts";

const KEYS: Record<string, string> = { HOST: "badgeHost", MOD: "badgeMod", VIP: "badgeVip", SUB: "badgeSub" };

// Schlüssel der Badge-Texte; gelten im Schema-Check als benutzt
export const BADGE_KEYS = Object.values(KEYS);

// Felder für die Badge-Texte, für Themes, die Badges beschriften
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
