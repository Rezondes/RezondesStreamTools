// Check for texts.de.ts: every error code has a text, and every code the server sends is in the
// shared list (src/core/errorCodes.ts). Runs with npm test.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ERROR_CODES } from "../core/errorCodes.ts";
import { SCENES } from "../core/theme.ts";
import { TEXTS } from "./texts.de.ts";

for (const code of ERROR_CODES) assert.ok(TEXTS.errors[code], `no text for ${code}`);
for (const scene of SCENES) assert.ok(TEXTS.scenes[scene], `no name for the scene ${scene}`);
assert.ok(TEXTS.notInTheme.length > 0);

// Texts with placeholders insert the values
assert.equal(TEXTS.triggers.confirmDelete("lizard"), 'Trigger "lizard" löschen?');
assert.equal(TEXTS.media.usage("1.0 MB", "200.0 MB"), "Belegt: 1.0 MB von 200.0 MB");
assert.equal(TEXTS.media.confirm("a.gif"), '"a.gif" löschen?');
assert.ok(TEXTS.media.confirmUsed("a.gif", "lizard, hype").includes("lizard, hype"));
assert.equal(TEXTS.render.frame(3, 96), "Frame 3/96");
assert.ok(TEXTS.render.hints.stinger(750).includes("750 ms"));
assert.equal(TEXTS.theme.range(0, 10), "0 bis 10");
assert.ok(TEXTS.theme.confirmSwitch(3).startsWith("3 "));
assert.ok(TEXTS.render.theme("Matrix").includes("Matrix"));
assert.equal(TEXTS.upload.running("a.gif", 2, 5), "Lade hoch (2/5): a.gif");
assert.ok(TEXTS.adminArea.revoked("neo").endsWith("neo"));
assert.ok(TEXTS.adminArea.betaRemoved("neo").endsWith("neo"));
assert.ok(TEXTS.adminArea.off("Chat").endsWith("Chat"));
assert.ok(TEXTS.adminArea.backupConfirmDelete("1.1.2026").includes("1.1.2026"));
assert.ok(TEXTS.adminArea.confirmDeleteStreamer("neo").startsWith("neo"));
assert.ok(TEXTS.adminArea.backupConfirmRestore("1.1.2026").includes("1.1.2026"));
assert.ok(TEXTS.adminArea.backupRestored(2, 1).includes("1 gelöschte"));
assert.ok(!TEXTS.adminArea.backupRestored(2, 0).includes("gelöschte"));
assert.equal(TEXTS.obs.collection("neo"), "Overlays neo");
assert.ok(TEXTS.theme.elsewhere("Stinger").startsWith("Stinger"));
assert.ok(TEXTS.obs.done(7).includes("7"));
assert.ok(TEXTS.obs.failed("kaputt").endsWith("kaputt"));

// Codes of the Rust server: text(status, "code"), redirects ?error=code and the code() of refusals and errors
const rust = join(import.meta.dirname, "../../server-rs/crates");
const read = (file: string) => readFileSync(join(rust, file), "utf8");
const handlers = join(rust, "rst-server/src");
const serverSources = readdirSync(handlers, { recursive: true, encoding: "utf8" })
  .filter(file => file.endsWith(".rs"))
  .map(file => readFileSync(join(handlers, file), "utf8"))
  .join("\n");
const codeArms = ["rst-server/src/routes.rs", "rst-domain/src/render/jobs.rs", "rst-infra/src/render/ffmpeg.rs", "rst-app/src/identity/login.rs"]
  .map(read)
  .join("\n");
const sent = [
  ...[...serverSources.matchAll(/text\([\w.]+, "([a-z][a-z-]+)"\)/g)].map(match => match[1]),
  ...[...serverSources.matchAll(/\?error=([a-z-]+)/g)].map(match => match[1]),
  ...[...codeArms.matchAll(/=> (?:Some\()?"([a-z][a-z-]+)"\)?,/g)].map(match => match[1]),
].filter(Boolean);
assert.ok(sent.length > 10, "no codes found in the server");
const missing = [...new Set(sent)].filter(code => !(ERROR_CODES as readonly string[]).includes(code));
assert.deepEqual(missing, [], `codes without an entry in errorCodes.ts: ${missing.join(", ")}`);

console.log("texts ok");
