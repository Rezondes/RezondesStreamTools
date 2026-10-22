// Check for graphicsFields.ts: the performance level as a choice with the three levels, default the middle one, and a
// stored level stays. Runs with npm test.
import assert from "node:assert/strict";
import { qualityField } from "./graphicsFields.ts";
import { resolveSettings } from "./settings.ts";

const field = qualityField("Allgemein");
assert.deepEqual(field, { key: "quality", type: "select", label: "Leistungsstufe Grafik", group: "Allgemein", default: "mittel", options: ["hoch", "mittel", "niedrig"] });

const probe = { id: "probe", name: "Probe", fields: [field] };
assert.equal(resolveSettings(probe, {}).quality, "mittel");
assert.equal(resolveSettings(probe, { quality: "niedrig" }).quality, "niedrig");
assert.equal(resolveSettings(probe, { quality: "ultra" }).quality, "mittel");

console.log("graphicsFields ok");
