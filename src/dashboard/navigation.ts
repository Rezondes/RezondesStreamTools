// Bereiche des Dashboards und wer sie sieht: ein Bereich erscheint nur, wenn alle seine Funktionen für den Streamer
// freigegeben sind (/api/me), Admin nur für Admins. Reine Funktionen, getestet in navigation.check.ts.

// Antwort von GET /api/me
// theme: das aktive Theme des Streamers (bestimmt den Skin des Dashboards)
export type Me = { login: string; admin: boolean; live: boolean; spotify: boolean | null; features: Record<string, boolean>; theme: string };

export type Section = "overview" | "theme" | "triggers" | "media" | "render" | "connections" | "admin";

// Reihenfolge = Reihenfolge in der Navigation. needs: Liste von Alternativen, eine davon muss ganz an sein
// (z.B. Rendern mit stinger oder mit banners), oder "admin"
const SECTIONS: readonly { section: Section; needs: readonly (readonly string[])[] | "admin" }[] = [
  { section: "overview", needs: [[]] },
  { section: "theme", needs: [["themes"]] },
  { section: "render", needs: [["stinger"], ["banners"]] },
  { section: "media", needs: [["triggers", "fx"]] },
  { section: "triggers", needs: [["triggers", "fx"]] },
  { section: "connections", needs: [[]] },
  { section: "admin", needs: "admin" },
];

export function visibleSections(me: Me): Section[] {
  const on = (features: readonly string[]) => features.every(feature => me.features[feature] === true);
  return SECTIONS
    .filter(({ needs }) => (needs === "admin" ? me.admin : needs.some(on)))
    .map(({ section }) => section);
}

// #/theme oder #/theme?x=1 zum Bereich; unbekannte oder nicht sichtbare Bereiche zeigen die Übersicht
export function sectionFromHash(hash: string, visible: readonly Section[]): Section {
  const name = hash.replace(/^#\/?/, "").split("?")[0];
  return visible.find(section => section === name) ?? "overview";
}
