// Check for settingsForm.ts: groups in schema order, reset, changes and errors per field. Runs with npm test.
import assert from "node:assert/strict";
import type { ThemeSchema } from "../core/theme.ts";
import type { ThemeSchema as ServerSchema } from "../generated/ThemeSchema.ts";
import { changedKeys, errorsByKey, groupFields, groupsForView, groupsWithoutScene, isDefault, pickSchema, resetAll, resetField } from "./settingsForm.ts";

const schema: ThemeSchema = {
  id: "probe",
  name: "Probe",
  fields: [
    { key: "accent", type: "color", label: "Color", group: "General", default: "#39ff14" },
    { key: "title", type: "text", label: "Title", group: "Scenes", default: "HELLO" },
    { key: "size", type: "number", label: "Size", group: "General", default: 10, min: 0, max: 100 },
    { key: "lines", type: "lines", label: "Lines", group: "Scenes", default: ["a", "b"] },
  ],
};

// Groups in the order of their first field, fields in schema order
assert.deepEqual(groupFields(schema).map(({ group, fields }) => [group, fields.map(field => field.key)]), [
  ["General", ["accent", "size"]],
  ["Scenes", ["title", "lines"]],
]);

// Groups per view: "general" shows the groups without an entry (they apply everywhere), a scene only its own
const scoped: ThemeSchema = { ...schema, groupScenes: { Scenes: ["starting"], Stinger: [] } };
assert.deepEqual(groupsForView(scoped, "general").map(({ group }) => group), ["General"]);
assert.deepEqual(groupsForView(scoped, "starting").map(({ group }) => group), ["Scenes"]);
assert.deepEqual(groupsForView(scoped, "chat").map(({ group }) => group), []);
assert.deepEqual(groupsForView(schema, "general").map(({ group }) => group), ["General", "Scenes"]);
assert.deepEqual(groupsForView(schema, "chat").map(({ group }) => group), []);

// Fields with their own scene appear only there, even if their group applies in several scenes
const screens: ThemeSchema = {
  id: "probe",
  name: "Probe",
  fields: [
    { key: "title", type: "text", label: "Title", group: "Scenes", default: "X" },
    { key: "startingLines", type: "lines", label: "Starting", group: "Scenes", default: [], scene: "starting" },
    { key: "brbLines", type: "lines", label: "BRB", group: "Scenes", default: [], scene: "brb" },
  ],
  groupScenes: { Scenes: ["starting", "brb", "ending"] },
};
const keysIn = (view: "starting" | "brb" | "ending") => groupsForView(screens, view).flatMap(({ fields }) => fields.map(field => field.key));
assert.deepEqual(keysIn("starting"), ["title", "startingLines"]);
assert.deepEqual(keysIn("brb"), ["title", "brbLines"]);
assert.deepEqual(keysIn("ending"), ["title"]);
assert.deepEqual(groupsWithoutScene(scoped), ["Stinger"]);
assert.deepEqual(groupsWithoutScene(schema), []);

// Reset: one field or everything to the default
const values = { accent: "#ff0000", title: "BYE", size: 20, lines: ["x"] };
assert.deepEqual(resetField(schema, values, "title"), { ...values, title: "HELLO" });
assert.deepEqual(resetAll(schema), { accent: "#39ff14", title: "HELLO", size: 10, lines: ["a", "b"] });

// Default detected, also for lists
assert.equal(isDefault(schema.fields[3], ["a", "b"]), true);
assert.equal(isDefault(schema.fields[3], ["a"]), false);

// Changed keys compared to the saved state
assert.deepEqual(changedKeys(resetAll(schema), { ...resetAll(schema), size: 11, lines: ["a", "b"] }), ["size"]);
assert.deepEqual(changedKeys(values, values), []);

// Errors from the server response per field
assert.deepEqual(errorsByKey([{ key: "size", code: "out_of_range" }, { key: "accent", code: "invalid_color" }]), { size: "out_of_range", accent: "invalid_color" });

console.log("settingsForm ok");

// The server's schema (format of GET /api/themes) wins over the built-in one; unknown ids fall back to the default
const fromServer: ServerSchema = JSON.parse(JSON.stringify({ ...schema, fields: [{ key: "accent", type: "color", label: "Color", group: "General", default: "#ff0000" }] })) as ServerSchema;
const local = (id: string) => (id === "probe" ? schema : null);
assert.equal(pickSchema([fromServer], local, scoped, "probe"), fromServer);
assert.equal(pickSchema(null, local, scoped, "probe"), schema);
assert.equal(pickSchema([fromServer], local, scoped, "nothing"), scoped);
assert.deepEqual(resetAll(pickSchema([fromServer], local, scoped, "probe")), { accent: "#ff0000" });
