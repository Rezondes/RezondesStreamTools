// Check für navigation.ts: welche Bereiche ein Streamer sieht und welcher Bereich zum Hash gehört. Läuft mit npm test.
import assert from "node:assert/strict";
import { sectionFromHash, visibleSections } from "./navigation.ts";

const me = (features: Record<string, boolean>, admin = false) => ({ login: "neo", admin, live: false, spotify: null, features });

// Nur Grundbereiche, wenn keine Funktion an ist
assert.deepEqual(visibleSections(me({})), ["overview", "connections"]);
// Theme mit themes, Trigger und Medien nur mit triggers und fx zusammen
assert.deepEqual(visibleSections(me({ themes: true, triggers: true, fx: true })), ["overview", "theme", "media", "triggers", "connections"]);
// Reihenfolge mit allem: Übersicht, Theme, Rendern, Medien, Trigger, Verbindungen, Admin
assert.deepEqual(visibleSections(me({ themes: true, triggers: true, fx: true, stinger: true }, true)), ["overview", "theme", "render", "media", "triggers", "connections", "admin"]);
// Rendern mit stinger oder banners
assert.deepEqual(visibleSections(me({ banners: true })), ["overview", "render", "connections"]);
assert.deepEqual(visibleSections(me({ stinger: true, banners: false })), ["overview", "render", "connections"]);
assert.deepEqual(visibleSections(me({ triggers: true, fx: false })), ["overview", "connections"]);
// Admin nur für Admins
assert.deepEqual(visibleSections(me({}, true)), ["overview", "connections", "admin"]);

// Hash zu Bereich: nur sichtbare Bereiche, sonst die Übersicht
const visible = visibleSections(me({ themes: true }));
assert.equal(sectionFromHash("#/theme", visible), "theme");
assert.equal(sectionFromHash("#/admin", visible), "overview");
assert.equal(sectionFromHash("", visible), "overview");
assert.equal(sectionFromHash("#/theme?x=1", visible), "theme");

console.log("navigation ok");
