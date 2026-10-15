// Check für access.ts: wer sich anmelden darf und wer welche Funktion bekommt. Läuft mit npm test.
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { canUse, hasFeature, loadAccess, revokedLogins, sanitize } from "./access.ts";

const admins = ["rezondes"];
const beta = sanitize({ registration: "allowlist", allowlist: ["Freund1"], beta: ["tester"], features: { music: "beta", fx: "off" } as never });

// Allowlist: nur Admins und gelistete Logins (Gross/klein egal)
assert.ok(canUse(beta, admins, "rezondes"));
assert.ok(canUse(beta, admins, "FREUND1"));
assert.ok(!canUse(beta, admins, "fremder"));
// Offene Anmeldung: alle
assert.ok(canUse({ ...beta, registration: "open" }, admins, "fremder"));

// Stufen: all für alle, beta nur für Beta-Tester und Admins, off für niemanden
assert.ok(hasFeature(beta, admins, "freund1", "alerts"));
assert.ok(!hasFeature(beta, admins, "freund1", "music"));
assert.ok(hasFeature(beta, admins, "tester", "music"));
assert.ok(hasFeature(beta, admins, "rezondes", "music"));
assert.ok(!hasFeature(beta, admins, "rezondes", "fx"));

// sanitize: unbekannte Stufen und Felder werden zu sicheren Standardwerten, Listen ohne Doppelte
const odd = sanitize({ registration: "jeder" as never, allowlist: [" A ", "a", ""], features: { music: "maybe" } as never });
assert.equal(odd.registration, "allowlist");
assert.deepEqual(odd.allowlist, ["a"]);
assert.equal(odd.features.music, "all");
assert.equal(Object.keys(odd.features).length, 8);

// Entzogener Zugang: wer vorher durfte und jetzt nicht mehr, nur unter den laufenden Logins; Admins nie
const before = sanitize({ allowlist: ["freund1", "freund2"] });
assert.deepEqual(revokedLogins(before, sanitize({ allowlist: ["freund2"] }), admins, ["rezondes", "freund1", "freund2"]), ["freund1"]);
assert.deepEqual(revokedLogins(before, sanitize({ allowlist: [] }), admins, ["rezondes"]), []);
assert.deepEqual(revokedLogins(sanitize({ registration: "open" }), sanitize({ allowlist: ["freund2"] }), admins, ["fremder", "freund2"]), ["fremder"]);
assert.deepEqual(revokedLogins(before, before, admins, ["freund1"]), []);

// Gespeicherter Zugang in einem temporären Ordner, der danach gelöscht wird
const folder = await mkdtemp(join(tmpdir(), "access-"));
try {
  // Ohne access.json: Allowlist aus den Admins, alle Funktionen an
  const store = await loadAccess(folder, admins);
  assert.deepEqual(store.get().allowlist, ["rezondes"]);
  assert.ok(store.canUse("rezondes"));
  assert.ok(store.isAdmin("REZONDES"));
  assert.ok(!store.isAdmin("freund"));
  assert.equal(store.features("freund").music, true);

  // Speichern bereinigt, wirkt sofort und übersteht einen Neustart
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
