// Check for routes.ts: which route belongs to method and path, who may call it and
// which overlay URL a path under /s/<login>/ is. Runs with npm test.
import assert from "node:assert/strict";
import { authorize, find, overlayRoute, ROUTES, type Visitor } from "./routes.ts";

// Method and path: known route, known path with the wrong method, unknown
assert.equal(find("GET", "/api/me"), "GET /api/me");
assert.equal(find("POST", "/api/triggers/config"), "POST /api/triggers/config");
assert.equal(find("GET", "/api/test"), "method-not-allowed");
assert.equal(find("DELETE", "/api/media"), "DELETE /api/media");
assert.equal(find("PUT", "/api/media"), "method-not-allowed");
assert.equal(find("GET", "/api/admin/streamers"), "GET /api/admin/streamers");
assert.equal(find("GET", "/alerts.html"), null);
assert.equal(find("GET", "/api/triggers/config/x"), null);
// Keys from the prototype of Object are not routes
assert.equal(find("GET", "constructor"), null);

const allOn = { alerts: true, chat: true, music: true, fx: true, triggers: true, stinger: true, banners: true };
const streamer: Visitor = { login: "freund", allowed: true, admin: false, features: allOn };

// Public routes need no session
assert.equal(authorize(ROUTES["GET /auth/login"], { login: null, allowed: false, admin: false, features: {} }), "ok");
assert.equal(authorize(ROUTES["GET /spotify/callback"], { login: null, allowed: false, admin: false, features: {} }), "ok");

// Dashboard: without session 401, not enabled 403, otherwise ok
assert.equal(authorize(ROUTES["GET /api/me"], { login: null, allowed: false, admin: false, features: {} }), "unauthorized");
assert.equal(authorize(ROUTES["GET /api/me"], { ...streamer, allowed: false }), "not-allowed");
assert.equal(authorize(ROUTES["GET /api/me"], streamer), "ok");
// Regenerate the overlay key: only with an own session
assert.equal(authorize(ROUTES["POST /api/overlay-key"], { login: null, allowed: false, admin: false, features: {} }), "unauthorized");
assert.equal(authorize(ROUTES["POST /api/overlay-key"], streamer), "ok");

// Feature levels: test alerts need alerts, triggers and media need triggers and fx, Spotify music
assert.equal(authorize(ROUTES["POST /api/test"], { ...streamer, features: { ...allOn, alerts: false } }), "feature-off");
assert.equal(authorize(ROUTES["POST /api/media"], { ...streamer, features: { ...allOn, fx: false } }), "feature-off");
assert.equal(authorize(ROUTES["DELETE /api/media"], { ...streamer, features: { ...allOn, triggers: false } }), "feature-off");
assert.equal(authorize(ROUTES["GET /api/triggers"], { ...streamer, features: { ...allOn, triggers: false } }), "feature-off");
assert.equal(authorize(ROUTES["GET /spotify/login"], { ...streamer, features: { ...allOn, music: false } }), "feature-off");
assert.equal(authorize(ROUTES["GET /spotify/login"], { ...streamer, features: {} }), "feature-off");
// Disconnecting Spotify and Twitch always works
assert.equal(authorize(ROUTES["POST /spotify/logout"], { ...streamer, features: {} }), "ok");
assert.equal(authorize(ROUTES["POST /api/twitch/disconnect"], { ...streamer, features: {} }), "ok");

// Admin routes only for admins
assert.equal(authorize(ROUTES["GET /api/admin/access"], streamer), "admin-only");
assert.equal(authorize(ROUTES["POST /api/admin/access"], { ...streamer, admin: true }), "ok");
// Both admin routes only for admins
assert.equal(authorize(ROUTES["GET /api/admin/streamers"], streamer), "admin-only");
assert.equal(authorize(ROUTES["GET /api/admin/streamers"], { ...streamer, admin: true }), "ok");

// Overlay URLs under /s/<login>/
assert.deepEqual(overlayRoute(["status"]), { kind: "status" });
assert.deepEqual(overlayRoute(["settings"]), { kind: "settings" });
assert.equal(overlayRoute(["settings", "x"]), null);
assert.deepEqual(overlayRoute(["events"]), { kind: "events" });
assert.deepEqual(overlayRoute(["commands"]), { kind: "commands" });
assert.deepEqual(overlayRoute([""]), { kind: "scene", file: "info.html" });
assert.deepEqual(overlayRoute([]), { kind: "scene", file: "info.html" });
assert.deepEqual(overlayRoute(["info"]), { kind: "scene", file: "info.html" });
assert.deepEqual(overlayRoute(["alerts.html"]), { kind: "scene", file: "alerts.html" });
// Without extension: only known scenes, they point to the same file
assert.deepEqual(overlayRoute(["alerts"]), { kind: "scene", file: "alerts.html" });
assert.deepEqual(overlayRoute(["starting"]), { kind: "scene", file: "starting.html" });
assert.deepEqual(overlayRoute(["minimes"]), { kind: "scene", file: "minimes.html" });
assert.equal(overlayRoute(["index"]), null);
assert.equal(overlayRoute(["unknown"]), null);
assert.deepEqual(overlayRoute(["media", "lizard.gif"]), { kind: "media", file: "lizard.gif" });
// Everything else is not an overlay URL: dashboard, foreign files, paths out of the media folder
assert.equal(overlayRoute(["index.html"]), null);
assert.equal(overlayRoute(["../tokens.json"]), null);
assert.equal(overlayRoute(["status", "x"]), null);
assert.equal(overlayRoute(["media", "../../tokens.json"]), null);
assert.equal(overlayRoute(["media", "tokens.json"]), null);
assert.equal(overlayRoute(["media", "a", "b.gif"]), null);

console.log("routes ok");
