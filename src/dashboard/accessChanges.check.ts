// Check für accessChanges.ts: gestrichene Logins, geschlossene Anmeldung und abgeschaltete Funktionen werden
// erkannt, unveränderter Zugang meldet nichts. Läuft mit npm test.
import assert from "node:assert/strict";
import type { Access } from "../../server/access.ts";
import { accessLosses, hasLosses } from "./accessChanges.ts";

const saved: Access = {
  registration: "open",
  allowlist: ["neo", "Trinity"],
  beta: ["morpheus"],
  features: { alerts: "all", chat: "all", music: "beta", fx: "all", triggers: "all", stinger: "off", banners: "all", themes: "all" },
};

// Nichts geändert
assert.equal(hasLosses(accessLosses(saved, saved)), false);

// Allowlist gekürzt, Anmeldung geschlossen, Beta-Tester gestrichen, Musik aus (Stinger war schon aus)
const next: Access = { ...saved, registration: "allowlist", allowlist: ["trinity"], beta: [], features: { ...saved.features, music: "off" } };
const losses = accessLosses(saved, next);
assert.deepEqual(losses, { revoked: ["neo"], betaRemoved: ["morpheus"], closed: true, off: ["music"] });
assert.equal(hasLosses(losses), true);

// Offene Anmeldung: aus der Allowlist streichen nimmt niemandem den Zugang
assert.deepEqual(accessLosses(saved, { ...saved, allowlist: [] }).revoked, []);

console.log("accessChanges ok");
