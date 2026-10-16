// Kontext Chat: Anzeige der Badges. Die Badges kommen als HOST, MOD, VIP, SUB aus core/ircEvents.ts; ein Theme kann
// dafür Texte haben (badgeHost, badgeMod, badgeVip, badgeSub), sonst bleibt das Kürzel. Rein; Check: chat.check.ts.
const KEYS: Record<string, string> = { HOST: "badgeHost", MOD: "badgeMod", VIP: "badgeVip", SUB: "badgeSub" };

// Schlüssel der Badge-Texte; gelten im Schema-Check als benutzt
export const BADGE_KEYS = Object.values(KEYS);

export function badgeLabel(badge: string, values: Record<string, unknown>) {
  const text = KEYS[badge] ? values[KEYS[badge]] : undefined;
  return typeof text === "string" && text ? text : badge;
}
