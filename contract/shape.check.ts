// Check for shape.ts: shape comparison with paths, extra keys allowed, and the summary with pending cases.
// Runs with npm test.
import assert from "node:assert/strict";
import { shapeErrors, summarize } from "./shape.ts";

// Shape comparison: an extra field is allowed; a missing field or a wrong type reports the path
const me = { login: "string", features: "object", spotify: "boolean|null" };
assert.deepEqual(shapeErrors(me, { login: "neo", features: {}, spotify: null, extra: 1 }), []);
assert.deepEqual(shapeErrors(me, { login: 7, spotify: true }), ["$.login: expected string, got number", "$.features: missing"]);
assert.deepEqual(shapeErrors({ list: [{ id: "number" }] }, { list: [{ id: 1 }, { id: "2" }] }), ["$.list[1].id: expected number, got string"]);
assert.deepEqual(shapeErrors(["string"], "x"), ["$: expected array, got string"]);
assert.deepEqual(shapeErrors(me, null), ["$: expected object, got null"]);
assert.deepEqual(shapeErrors("any", undefined), []);
assert.deepEqual(shapeErrors("array", []), []);

// Pending cases: failing pending cases do not fail the run, passing ones are reported as fixed, unknown names fail
const results = [{ name: "a", error: null }, { name: "b", error: "boom" }, { name: "c", error: "boom" }];
assert.deepEqual(summarize(results, ["b"]), { failed: [{ name: "c", error: "boom" }], fixed: [], unknownPending: [], ok: false });
assert.deepEqual(summarize(results, ["a", "b", "c"]), { failed: [], fixed: ["a"], unknownPending: [], ok: true });
assert.equal(summarize(results, ["b", "c", "gone"]).ok, false);
assert.deepEqual(summarize(results, ["b", "c", "gone"]).unknownPending, ["gone"]);

console.log("shape ok");
