// Writes the TypeScript theme schemas as JSON fixtures for the Rust domain (RUST-PLAN.md package 8):
// server-rs/crates/rst-domain/tests/fixtures/<id>.json. The Rust tests compare their schemas field by field with
// these files, so both sides stay equal while both exist. personalize becomes sample values for a few logins.
//   node scripts/dumpSchema.ts        rewrite the fixtures
// dumpSchema.check.ts fails when a fixture no longer matches the TypeScript schema.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ThemeSchema } from "../src/core/theme.ts";
import { THEMES } from "../src/themes/registry.ts";

export const FIXTURES = join("server-rs", "crates", "rst-domain", "tests", "fixtures");
export const SAMPLE_LOGINS = ["neo", "rezondes", "neo_42"] as const;

// The schema as plain data; personalize as its result for the sample logins
export function schemaFixture(schema: ThemeSchema) {
  const { personalize, ...data } = schema;
  const samples = personalize ? Object.fromEntries(SAMPLE_LOGINS.map(login => [login, personalize(login)])) : {};
  return { ...data, personalize: samples };
}

export const fixtureText = (schema: ThemeSchema) => `${JSON.stringify(schemaFixture(schema), null, 2)}\n`;

function main() {
  mkdirSync(FIXTURES, { recursive: true });
  for (const schema of THEMES) writeFileSync(join(FIXTURES, `${schema.id}.json`), fixtureText(schema));
  console.log(`${THEMES.length} theme fixtures written to ${FIXTURES}`);
}

if (import.meta.main) main();
