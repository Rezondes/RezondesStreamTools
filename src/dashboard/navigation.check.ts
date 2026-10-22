// Check for navigation.ts: which sections a streamer sees and which section belongs to the hash. Runs with npm test.
import assert from "node:assert/strict";
import { sectionFromHash, visibleSections } from "./navigation.ts";

const me = (features: Record<string, boolean>, admin = false) => ({ login: "neo", admin, live: false, spotify: null, features, theme: "standard", overlayKey: "k1", createdAt: null, lastLogin: null });

// Only base sections when no feature is on
assert.deepEqual(visibleSections(me({})), ["overview", "account"]);
// Theme with themes, triggers and media only with triggers and fx together
assert.deepEqual(visibleSections(me({ themes: true, triggers: true, fx: true })), ["overview", "theme", "media", "triggers", "account"]);
// Order with everything: overview, theme, render, panels, media, triggers, account, admin
assert.deepEqual(visibleSections(me({ themes: true, triggers: true, fx: true, stinger: true, banners: true }, true)), ["overview", "theme", "render", "panels", "media", "triggers", "account", "admin"]);
// Render with stinger or banners
assert.deepEqual(visibleSections(me({ banners: true })), ["overview", "render", "panels", "account"]);
assert.deepEqual(visibleSections(me({ stinger: true, banners: false })), ["overview", "render", "account"]);
assert.deepEqual(visibleSections(me({ triggers: true, fx: false })), ["overview", "account"]);
// Admin only for admins
assert.deepEqual(visibleSections(me({}, true)), ["overview", "account", "admin"]);

// Hash to section: only visible sections, otherwise the overview
const visible = visibleSections(me({ themes: true }));
assert.equal(sectionFromHash("#/theme", visible), "theme");
assert.equal(sectionFromHash("#/admin", visible), "overview");
assert.equal(sectionFromHash("", visible), "overview");
assert.equal(sectionFromHash("#/theme?x=1", visible), "theme");

console.log("navigation ok");
