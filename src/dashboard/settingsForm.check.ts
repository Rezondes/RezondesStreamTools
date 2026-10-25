// Check for settingsForm.ts: groups in schema order, reset, changes and errors per field. Runs with npm test.
import assert from "node:assert/strict";
import { choice, choiceBy, lines } from "../core/fields.ts";
import type { SettingField, ThemeSchema } from "../core/theme.ts";
import type { ThemeSchema as ServerSchema } from "../generated/ThemeSchema.ts";
import {
  changedKeys, errorsByKey, fieldsByKind, groupFields, groupsForMode, groupsForView, groupsWithoutScene, hiddenKeys, isDefault, pickSchema, resetAll, resetField, shownField, statKeysHint, viewOfField,
} from "./settingsForm.ts";

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

// Options by another field: only those for its value (its default while unset), all for an unknown value
const breeds = choice("dog", "Dog", "A", "corgi", ["corgi", "mops"]);
const coats = choiceBy("coat", "Coat", "A", "red", "dog", { corgi: ["red", "sable"], mops: ["beige"] });
const dogs: ThemeSchema = { id: "dogs", name: "Dogs", fields: [breeds, coats] };
const offered = (values: Record<string, string>) => { const field = shownField(dogs, coats, values); return field.type === "select" ? field.options : []; };
assert.deepEqual(coats.options, ["red", "sable", "beige"]);
assert.deepEqual(offered({}), ["red", "sable"]);
assert.deepEqual(offered({ dog: "mops" }), ["beige"]);
assert.deepEqual(offered({ dog: "wolf" }), ["red", "sable", "beige"]);
assert.equal(shownField(dogs, breeds, {}), breeds);

// Stream number lines ("(Schlüssel|Text)" in the label) name the keys that can be used, other fields nothing
const statLines = lines("statsLines", "Zahlen (Schlüssel|Text)", "A", ["follows|Follows"]);
assert.ok(statKeysHint(statLines)?.includes("follows") && statKeysHint(statLines)?.includes("duration"));
assert.equal(statKeysHint(lines("terminal", "Zeilen", "A", [])), null);
assert.equal(statKeysHint(breeds), null);

// Default detected, also for lists
assert.equal(isDefault(schema.fields[3], ["a", "b"]), true);
assert.equal(isDefault(schema.fields[3], ["a"]), false);

// Changed keys compared to the saved state
assert.deepEqual(changedKeys(resetAll(schema), { ...resetAll(schema), size: 11, lines: ["a", "b"] }), ["size"]);
assert.deepEqual(changedKeys(values, values), []);

// Errors from the server response per field
assert.deepEqual(errorsByKey([{ key: "size", code: "out_of_range" }, { key: "accent", code: "invalid_color" }]), { size: "out_of_range", accent: "invalid_color" });

// Simple view: only the basic fields of the groups of a view, empty groups drop out; advanced = groupsForView
const modes: ThemeSchema = {
  id: "probe",
  name: "Probe",
  fields: [
    { key: "a", type: "text", label: "A", group: "G", default: "", basic: true },
    { key: "b", type: "number", label: "B", group: "G", default: 1, min: 0, max: 9 },
    { key: "c", type: "color", label: "C", group: "H", default: "#000000" },
    { key: "d", type: "text", label: "D", group: "S", default: "", basic: true, scene: "brb" },
    { key: "e", type: "boolean", label: "E", group: "R", default: true },
  ],
  groupScenes: { S: ["brb"], R: [] },
};
const shape = (groups: { group: string; fields: { key: string }[] }[]) => groups.map(({ group, fields }) => [group, fields.map(field => field.key)]);
assert.deepEqual(shape(groupsForMode(modes, "general", "einfach")), [["G", ["a"]]]);
assert.deepEqual(groupsForMode(modes, "general", "erweitert"), groupsForView(modes, "general"));

// Kinds in a fixed order, empty kinds drop out, schema order inside a kind
const mixed: SettingField[] = [
  { key: "n", type: "number", label: "N", group: "G", default: 1, min: 0, max: 9 },
  { key: "c1", type: "color", label: "C1", group: "G", default: "#000000" },
  { key: "t", type: "text", label: "T", group: "G", default: "" },
  { key: "f", type: "boolean", label: "F", group: "G", default: true },
  { key: "s", type: "sound", label: "S", group: "G", default: { file: "", volume: 1 } },
  { key: "c2", type: "color", label: "C2", group: "G", default: "#ffffff" },
];
assert.deepEqual(fieldsByKind(mixed).map(({ kind, fields }) => [kind, fields.map(field => field.key)]), [
  ["texts", ["t"]],
  ["colors", ["c1", "c2"]],
  ["switches", ["f"]],
  ["numbers", ["n"]],
  ["media", ["s"]],
]);

// Keys not visible in a view and mode: not basic in the simple view, or in another view
assert.deepEqual(hiddenKeys(modes, "general", "einfach", ["a", "b"]), ["b"]);
assert.deepEqual(hiddenKeys(modes, "general", "erweitert", ["a", "b"]), []);
assert.deepEqual(hiddenKeys(modes, "general", "erweitert", ["a", "d"]), ["d"]);

// The view a field stands in: general, its scene, or render for groups that apply in no scene
assert.equal(viewOfField(modes, "b"), "general");
assert.equal(viewOfField(modes, "d"), "brb");
assert.equal(viewOfField(modes, "e"), "render");

console.log("settingsForm ok");

// The server's schema (format of GET /api/themes) wins over the built-in one; unknown ids fall back to the default
const fromServer: ServerSchema = JSON.parse(JSON.stringify({ ...schema, fields: [{ key: "accent", type: "color", label: "Color", group: "General", default: "#ff0000" }] })) as ServerSchema;
const local = (id: string) => (id === "probe" ? schema : null);
assert.equal(pickSchema([fromServer], local, scoped, "probe"), fromServer);
assert.equal(pickSchema(null, local, scoped, "probe"), schema);
assert.equal(pickSchema([fromServer], local, scoped, "nothing"), scoped);
assert.deepEqual(resetAll(pickSchema([fromServer], local, scoped, "probe")), { accent: "#ff0000" });
