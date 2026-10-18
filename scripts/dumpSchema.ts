// Writes the TypeScript theme schemas as JSON fixtures for the Rust domain (RUST-PLAN.md package 8):
// server-rs/crates/rst-domain/tests/fixtures/<id>.json. The Rust tests compare their schemas field by field with
// these files, so both sides stay equal while both exist. personalize becomes sample values for a few logins.
// minime-features.json holds the opt-in fields of the core minime features with a sample set, so Rust and TypeScript
// stay equal before a theme uses them.
//   node scripts/dumpSchema.ts        rewrite the fixtures
// dumpSchema.check.ts fails when a fixture no longer matches the TypeScript schema.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { minimeTeamFields } from "../src/core/minimeFields.ts";
import type { MinimeVariantSet, ThemeSchema } from "../src/core/theme.ts";
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

// Sample factions: one with all values, one without a color
const SAMPLE_TEAMS: MinimeVariantSet = {
  command: "!team",
  label: "Fraktion",
  variants: [{ id: "blau", label: "Blau", names: ["blau", "blue"], color: "#3366ff" }, { id: "rot", label: "Rot", names: ["rot"] }],
};
export const FEATURES_FILE = "minime-features.json";
export const featuresText = () => `${JSON.stringify({ teams: { set: SAMPLE_TEAMS, fields: minimeTeamFields(SAMPLE_TEAMS) } }, null, 2)}\n`;

function main() {
  mkdirSync(FIXTURES, { recursive: true });
  for (const schema of THEMES) writeFileSync(join(FIXTURES, `${schema.id}.json`), fixtureText(schema));
  writeFileSync(join(FIXTURES, FEATURES_FILE), featuresText());
  console.log(`${THEMES.length} theme fixtures written to ${FIXTURES}`);
}

if (import.meta.main) main();
