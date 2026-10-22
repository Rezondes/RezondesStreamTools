// Check for navigation.ts: which sections a streamer sees and which section belongs to the hash. Runs with npm test.
import assert from "node:assert/strict";
import { sectionFromHash, visibleSections } from "./navigation.ts";

const me = (features: Record<string, boolean>, admin = false) => ({ login: "neo", admin, live: false, spotify: null, features, theme: "standard", overlayKey: "k1" });

// Only base sections when no feature is on
assert.deepEqual(visibleSections(me({})), ["overview", "connections"]);
// Theme with themes, triggers and media only with triggers and fx together
assert.deepEqual(visibleSections(me({ themes: true, triggers: true, fx: true })), ["overview", "theme", "media", "triggers", "connections"]);
// Order with everything: overview, theme, render, panels, media, triggers, connections, admin
assert.deepEqual(visibleSections(me({ themes: true, triggers: true, fx: true, stinger: true, banners: true }, true)), ["overview", "theme", "render", "panels", "media", "triggers", "connections", "admin"]);
// Render with stinger or banners
assert.deepEqual(visibleSections(me({ banners: true })), ["overview", "render", "panels", "connections"]);
assert.deepEqual(visibleSections(me({ stinger: true, banners: false })), ["overview", "render", "connections"]);
assert.deepEqual(visibleSections(me({ triggers: true, fx: false })), ["overview", "connections"]);
// Admin only for admins
assert.deepEqual(visibleSections(me({}, true)), ["overview", "connections", "admin"]);

// Hash to section: only visible sections, otherwise the overview
const visible = visibleSections(me({ themes: true }));
assert.equal(sectionFromHash("#/theme", visible), "theme");
assert.equal(sectionFromHash("#/admin", visible), "overview");
assert.equal(sectionFromHash("", visible), "overview");
assert.equal(sectionFromHash("#/theme?x=1", visible), "theme");

console.log("navigation ok");
