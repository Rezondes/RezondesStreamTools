// Check for access.ts: who may log in and who gets which feature. Runs with npm test.
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { canUse, hasFeature, loadAccess, revokedLogins, sanitize } from "./access.ts";

const admins = ["rezondes"];
const beta = sanitize({ registration: "allowlist", allowlist: ["Freund1"], beta: ["tester"], features: { music: "beta", fx: "off" } as never });

// Allowlist: only admins and listed logins (case-insensitive)
assert.ok(canUse(beta, admins, "rezondes"));
assert.ok(canUse(beta, admins, "FREUND1"));
assert.ok(!canUse(beta, admins, "fremder"));
// Open registration: everyone
assert.ok(canUse({ ...beta, registration: "open" }, admins, "fremder"));

// Levels: all for everyone, beta only for beta testers and admins, off for nobody
assert.ok(hasFeature(beta, admins, "freund1", "alerts"));
assert.ok(!hasFeature(beta, admins, "freund1", "music"));
assert.ok(hasFeature(beta, admins, "tester", "music"));
assert.ok(hasFeature(beta, admins, "rezondes", "music"));
assert.ok(!hasFeature(beta, admins, "rezondes", "fx"));

// sanitize: unknown levels and fields become safe defaults, lists without duplicates
const odd = sanitize({ registration: "anyone" as never, allowlist: [" A ", "a", ""], features: { music: "maybe" } as never });
assert.equal(odd.registration, "allowlist");
assert.deepEqual(odd.allowlist, ["a"]);
assert.equal(odd.features.music, "all");
assert.equal(Object.keys(odd.features).length, 9);
assert.equal(odd.features.minimes, "all");

// Revoked access: who was allowed before and no longer is, only among the running logins; admins never
const before = sanitize({ allowlist: ["freund1", "freund2"] });
assert.deepEqual(revokedLogins(before, sanitize({ allowlist: ["freund2"] }), admins, ["rezondes", "freund1", "freund2"]), ["freund1"]);
assert.deepEqual(revokedLogins(before, sanitize({ allowlist: [] }), admins, ["rezondes"]), []);
assert.deepEqual(revokedLogins(sanitize({ registration: "open" }), sanitize({ allowlist: ["freund2"] }), admins, ["fremder", "freund2"]), ["fremder"]);
assert.deepEqual(revokedLogins(before, before, admins, ["freund1"]), []);

// Saved access in a temporary folder that is deleted afterwards
const folder = await mkdtemp(join(tmpdir(), "access-"));
try {
  // Without access.json: allowlist from the admins, all features on
  const store = await loadAccess(folder, admins);
  assert.deepEqual(store.get().allowlist, ["rezondes"]);
  assert.ok(store.canUse("rezondes"));
  assert.ok(store.isAdmin("REZONDES"));
  assert.ok(!store.isAdmin("freund"));
  assert.equal(store.features("freund").music, true);

  // Saving cleans up, takes effect immediately and survives a restart
  await store.save({ allowlist: ["Freund"], beta: [], features: { music: "off" } as never });
  assert.ok(store.canUse("freund"));
  assert.ok(!store.hasFeature("freund", "music"));
  const reloaded = await loadAccess(folder, admins);
  assert.deepEqual(reloaded.get(), store.get());
  assert.match(await readFile(join(folder, "access.json"), "utf8"), /"registration": "allowlist"/);
} finally {
  await rm(folder, { recursive: true, force: true });
}

console.log("access ok");
