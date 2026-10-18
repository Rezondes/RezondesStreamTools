// Check for dumpSchema.ts: every theme becomes a fixture with plain data and personalize samples, and the fixtures
// in server-rs are current (otherwise: node scripts/dumpSchema.ts). Runs with npm test.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { THEMES } from "../src/themes/registry.ts";
import { FEATURES_FILE, featuresText, FIXTURES, fixtureText, SAMPLE_LOGINS, schemaFixture } from "./dumpSchema.ts";

// All three themes, personalize as sample values for every sample login
assert.deepEqual(THEMES.map(theme => theme.id), ["standard", "matrix", "suedfrucht"]);
const standard = schemaFixture(THEMES[0]);
assert.deepEqual(Object.keys(standard.personalize), [...SAMPLE_LOGINS]);
assert.deepEqual(standard.personalize.neo, { channelName: "NEO" });
assert.deepEqual(schemaFixture({ ...THEMES[0], personalize: undefined }).personalize, {});

// The written fixtures match the current TypeScript schemas
for (const theme of THEMES) {
  const file = join(FIXTURES, `${theme.id}.json`);
  assert.ok(existsSync(file), `missing fixture ${file}: run node scripts/dumpSchema.ts`);
  assert.equal(readFileSync(file, "utf8").replace(/\r\n/g, "\n"), fixtureText(theme), `stale fixture ${file}: run node scripts/dumpSchema.ts`);
}

// The opt-in feature fields are current too
const features = join(FIXTURES, FEATURES_FILE);
assert.ok(existsSync(features), `missing fixture ${features}: run node scripts/dumpSchema.ts`);
assert.equal(readFileSync(features, "utf8").replace(/\r\n/g, "\n"), featuresText(), `stale fixture ${features}: run node scripts/dumpSchema.ts`);

console.log("dumpSchema ok");
