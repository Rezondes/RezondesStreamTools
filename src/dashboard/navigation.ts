// Bereiche des Dashboards und wer sie sieht: ein Bereich erscheint nur, wenn alle seine Funktionen für den Streamer
// freigegeben sind (/api/me), Admin nur für Admins. Reine Funktionen, getestet in navigation.check.ts.

// Antwort von GET /api/me
export type Me = { login: string; admin: boolean; live: boolean; spotify: boolean | null; features: Record<string, boolean> };

export type Section = "overview" | "theme" | "triggers" | "media" | "connections" | "admin";

// Reihenfolge = Reihenfolge in der Navigation; needs: Funktionen (alle nötig) oder "admin"
const SECTIONS: readonly { section: Section; needs: readonly string[] | "admin" }[] = [
  { section: "overview", needs: [] },
  { section: "theme", needs: ["themes"] },
  { section: "triggers", needs: ["triggers", "fx"] },
  { section: "media", needs: ["triggers", "fx"] },
  { section: "connections", needs: [] },
  { section: "admin", needs: "admin" },
];

export function visibleSections(me: Me): Section[] {
  return SECTIONS
    .filter(({ needs }) => (needs === "admin" ? me.admin : needs.every(feature => me.features[feature] === true)))
    .map(({ section }) => section);
}

// #/theme oder #/theme?x=1 zum Bereich; unbekannte oder nicht sichtbare Bereiche zeigen die Übersicht
export function sectionFromHash(hash: string, visible: readonly Section[]): Section {
  const name = hash.replace(/^#\/?/, "").split("?")[0];
  return visible.find(section => section === name) ?? "overview";
}
