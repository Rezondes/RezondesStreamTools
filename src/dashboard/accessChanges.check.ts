// Check for accessChanges.ts: removed logins, closed registration and switched-off features are
// detected, unchanged access reports nothing. Runs with npm test.
import assert from "node:assert/strict";
import type { AccessPolicy as Access } from "../generated/AccessPolicy.ts";
import { accessLosses, hasLosses } from "./accessChanges.ts";

const saved: Access = {
  registration: "open",
  allowlist: ["neo", "Trinity"],
  beta: ["morpheus"],
  features: { alerts: "all", chat: "all", music: "beta", fx: "all", triggers: "all", stinger: "off", banners: "all", themes: "all", minimes: "all" },
};

// Nothing changed
assert.equal(hasLosses(accessLosses(saved, saved)), false);

// Allowlist shortened, registration closed, beta tester removed, music off (stinger was off already)
const next: Access = { ...saved, registration: "allowlist", allowlist: ["trinity"], beta: [], features: { ...saved.features, music: "off" } };
const losses = accessLosses(saved, next);
assert.deepEqual(losses, { revoked: ["neo"], betaRemoved: ["morpheus"], closed: true, off: ["music"] });
assert.equal(hasLosses(losses), true);

// Open registration: removing someone from the allowlist takes nobody's access
assert.deepEqual(accessLosses(saved, { ...saved, allowlist: [] }).revoked, []);

console.log("accessChanges ok");
