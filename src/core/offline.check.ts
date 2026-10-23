// Check of offline.ts: the page of a downloaded file, nothing for a page of the server
import assert from "node:assert/strict";
import { offline, offlinePageOf } from "./offline.ts";

const page = { scene: "brb", settings: { theme: "standard", values: {} }, media: { "logo.png": "data:image/png;base64,AA==" } };
assert.deepEqual(offlinePageOf({ RST_OFFLINE: page }), page);
assert.equal(offlinePageOf({}), null);
assert.equal(offline, null, "node is no downloaded file");

console.log("offline ok");
