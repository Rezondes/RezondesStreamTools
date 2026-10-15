// Check für settingsForm.ts: Gruppen in Schema-Reihenfolge, Zurücksetzen, Änderungen und Fehler je Feld. Läuft mit npm test.
import assert from "node:assert/strict";
import type { ThemeSchema } from "../core/theme.ts";
import { changedKeys, errorsByKey, groupFields, groupsForScene, groupsWithoutScene, isDefault, resetAll, resetField } from "./settingsForm.ts";

const schema: ThemeSchema = {
  id: "probe",
  name: "Probe",
  fields: [
    { key: "accent", type: "color", label: "Farbe", group: "Allgemein", default: "#39ff14" },
    { key: "title", type: "text", label: "Titel", group: "Szenen", default: "HALLO" },
    { key: "size", type: "number", label: "Grösse", group: "Allgemein", default: 10, min: 0, max: 100 },
    { key: "lines", type: "lines", label: "Zeilen", group: "Szenen", default: ["a", "b"] },
  ],
};

// Gruppen in der Reihenfolge ihres ersten Feldes, Felder in Schema-Reihenfolge
assert.deepEqual(groupFields(schema).map(({ group, fields }) => [group, fields.map(field => field.key)]), [
  ["Allgemein", ["accent", "size"]],
  ["Szenen", ["title", "lines"]],
]);

// Gruppen je Szene: ohne Eintrag überall, sonst nur in den genannten Szenen, [] nirgends
const scoped: ThemeSchema = { ...schema, groupScenes: { Szenen: ["starting"], Stinger: [] } };
assert.deepEqual(groupsForScene(scoped, "starting").map(({ group }) => group), ["Allgemein", "Szenen"]);
assert.deepEqual(groupsForScene(scoped, "chat").map(({ group }) => group), ["Allgemein"]);
assert.deepEqual(groupsForScene(schema, "chat").map(({ group }) => group), ["Allgemein", "Szenen"]);
assert.deepEqual(groupsWithoutScene(scoped), ["Stinger"]);
assert.deepEqual(groupsWithoutScene(schema), []);

// Zurücksetzen: ein Feld oder alles auf den Standard
const values = { accent: "#ff0000", title: "TSCHÜSS", size: 20, lines: ["x"] };
assert.deepEqual(resetField(schema, values, "title"), { ...values, title: "HALLO" });
assert.deepEqual(resetAll(schema), { accent: "#39ff14", title: "HALLO", size: 10, lines: ["a", "b"] });

// Standard erkannt, auch bei Listen
assert.equal(isDefault(schema.fields[3], ["a", "b"]), true);
assert.equal(isDefault(schema.fields[3], ["a"]), false);

// Geänderte Schlüssel gegenüber dem gespeicherten Stand
assert.deepEqual(changedKeys(resetAll(schema), { ...resetAll(schema), size: 11, lines: ["a", "b"] }), ["size"]);
assert.deepEqual(changedKeys(values, values), []);

// Fehler aus der Server-Antwort je Feld
assert.deepEqual(errorsByKey([{ key: "size", code: "out_of_range" }, { key: "accent", code: "invalid_color" }]), { size: "out_of_range", accent: "invalid_color" });

console.log("settingsForm ok");
