// Check für routes.ts: welche Route zu Methode und Pfad gehört, wer sie aufrufen darf und
// welche Overlay-Adresse ein Pfad unter /s/<login>/ ist. Läuft mit npm test.
import assert from "node:assert/strict";
import { authorize, find, overlayRoute, ROUTES, type Visitor } from "./routes.ts";

// Methode und Pfad: bekannte Route, bekannter Pfad mit falscher Methode, unbekannt
assert.equal(find("GET", "/api/me"), "GET /api/me");
assert.equal(find("POST", "/api/triggers/config"), "POST /api/triggers/config");
assert.equal(find("GET", "/api/test"), "method-not-allowed");
assert.equal(find("DELETE", "/api/media"), "DELETE /api/media");
assert.equal(find("PUT", "/api/media"), "method-not-allowed");
assert.equal(find("GET", "/api/admin/streamers"), "GET /api/admin/streamers");
assert.equal(find("GET", "/alerts.html"), null);
assert.equal(find("GET", "/api/triggers/config/x"), null);
// Schlüssel aus dem Prototyp von Object sind keine Routen
assert.equal(find("GET", "constructor"), null);

const allOn = { alerts: true, chat: true, music: true, fx: true, triggers: true, stinger: true, banners: true };
const streamer: Visitor = { login: "freund", allowed: true, admin: false, features: allOn };

// Öffentliche Routen brauchen keine Sitzung
assert.equal(authorize(ROUTES["GET /auth/login"], { login: null, allowed: false, admin: false, features: {} }), "ok");
assert.equal(authorize(ROUTES["GET /spotify/callback"], { login: null, allowed: false, admin: false, features: {} }), "ok");

// Dashboard: ohne Sitzung 401, nicht freigeschaltet 403, sonst ok
assert.equal(authorize(ROUTES["GET /api/me"], { login: null, allowed: false, admin: false, features: {} }), "unauthorized");
assert.equal(authorize(ROUTES["GET /api/me"], { ...streamer, allowed: false }), "not-allowed");
assert.equal(authorize(ROUTES["GET /api/me"], streamer), "ok");

// Funktionsstufen: Test-Alerts brauchen alerts, Trigger und Medien brauchen triggers und fx, Spotify music
assert.equal(authorize(ROUTES["POST /api/test"], { ...streamer, features: { ...allOn, alerts: false } }), "feature-off");
assert.equal(authorize(ROUTES["POST /api/media"], { ...streamer, features: { ...allOn, fx: false } }), "feature-off");
assert.equal(authorize(ROUTES["DELETE /api/media"], { ...streamer, features: { ...allOn, triggers: false } }), "feature-off");
assert.equal(authorize(ROUTES["GET /api/triggers"], { ...streamer, features: { ...allOn, triggers: false } }), "feature-off");
assert.equal(authorize(ROUTES["GET /spotify/login"], { ...streamer, features: { ...allOn, music: false } }), "feature-off");
assert.equal(authorize(ROUTES["GET /spotify/login"], { ...streamer, features: {} }), "feature-off");
// Spotify trennen und Twitch trennen gehen immer
assert.equal(authorize(ROUTES["POST /spotify/logout"], { ...streamer, features: {} }), "ok");
assert.equal(authorize(ROUTES["POST /api/twitch/disconnect"], { ...streamer, features: {} }), "ok");

// Admin-Routen nur für Admins
assert.equal(authorize(ROUTES["GET /api/admin/access"], streamer), "admin-only");
assert.equal(authorize(ROUTES["POST /api/admin/access"], { ...streamer, admin: true }), "ok");
// Beide Admin-Routen nur für Admins
assert.equal(authorize(ROUTES["GET /api/admin/streamers"], streamer), "admin-only");
assert.equal(authorize(ROUTES["GET /api/admin/streamers"], { ...streamer, admin: true }), "ok");

// Overlay-Adressen unter /s/<login>/
assert.deepEqual(overlayRoute(["status"]), { kind: "status" });
assert.deepEqual(overlayRoute(["settings"]), { kind: "settings" });
assert.equal(overlayRoute(["settings", "x"]), null);
assert.deepEqual(overlayRoute(["events"]), { kind: "events" });
assert.deepEqual(overlayRoute(["commands"]), { kind: "commands" });
assert.deepEqual(overlayRoute(["alerts.html"]), { kind: "scene", file: "alerts.html" });
// Ohne Endung: nur bekannte Szenen, sie zeigen auf dieselbe Datei
assert.deepEqual(overlayRoute(["alerts"]), { kind: "scene", file: "alerts.html" });
assert.deepEqual(overlayRoute(["starting"]), { kind: "scene", file: "starting.html" });
assert.deepEqual(overlayRoute(["minimes"]), { kind: "scene", file: "minimes.html" });
assert.equal(overlayRoute(["index"]), null);
assert.equal(overlayRoute(["unbekannt"]), null);
assert.deepEqual(overlayRoute(["media", "lizard.gif"]), { kind: "media", file: "lizard.gif" });
// Alles andere ist keine Overlay-Adresse: Dashboard, fremde Dateien, Pfade aus dem Medienordner hinaus
assert.equal(overlayRoute([]), null);
assert.equal(overlayRoute([""]), null);
assert.equal(overlayRoute(["index.html"]), null);
assert.equal(overlayRoute(["../tokens.json"]), null);
assert.equal(overlayRoute(["status", "x"]), null);
assert.equal(overlayRoute(["media", "../../tokens.json"]), null);
assert.equal(overlayRoute(["media", "tokens.json"]), null);
assert.equal(overlayRoute(["media", "a", "b.gif"]), null);

console.log("routes ok");
