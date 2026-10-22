// Sections of the dashboard and who sees them: a section only appears when all its features are released for the
// streamer (/api/me), admin only for admins. Pure functions, tested in navigation.check.ts.

import type { DashboardPrefs } from "../generated/DashboardPrefs.ts";

// Answer of GET /api/me
// theme: the streamer's active theme (decides the skin of the dashboard)
// overlayKey: secret key for the OBS URLs (?key=), without it overlays get no live events
// live: the EventSub connection is up (alerts arrive); createdAt, lastLogin: ms, null when unknown; prefs: how the
// dashboard looks and its language (account page)
export type Me = {
  login: string; admin: boolean; live: boolean; spotify: boolean | null; features: Record<string, boolean>; theme: string; overlayKey: string;
  createdAt: number | null; lastLogin: number | null; prefs: DashboardPrefs;
};

export type Section = "overview" | "theme" | "triggers" | "media" | "render" | "panels" | "account" | "admin";

// Order = order in the navigation. needs: list of alternatives, one of them must be fully on
// (e.g. render with stinger or with banners), or "admin"
const SECTIONS: readonly { section: Section; needs: readonly (readonly string[])[] | "admin" }[] = [
  { section: "overview", needs: [[]] },
  { section: "theme", needs: [["themes"]] },
  { section: "render", needs: [["stinger"], ["banners"]] },
  { section: "panels", needs: [["banners"]] },
  { section: "media", needs: [["triggers", "fx"]] },
  { section: "triggers", needs: [["triggers", "fx"]] },
  { section: "account", needs: [[]] },
  { section: "admin", needs: "admin" },
];

export function visibleSections(me: Me): Section[] {
  const on = (features: readonly string[]) => features.every(feature => me.features[feature] === true);
  return SECTIONS
    .filter(({ needs }) => (needs === "admin" ? me.admin : needs.some(on)))
    .map(({ section }) => section);
}

// #/theme or #/theme?x=1 to the section; unknown or invisible sections show the overview
export function sectionFromHash(hash: string, visible: readonly Section[]): Section {
  const name = hash.replace(/^#\/?/, "").split("?")[0];
  return visible.find(section => section === name) ?? "overview";
}
