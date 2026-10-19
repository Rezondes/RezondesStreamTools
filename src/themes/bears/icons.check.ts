// Check for icons.ts (symbols of the alert kinds): every name has a filled shape, all paths start with M. Runs with npm test.
import assert from "node:assert/strict";
import { ICON_NAMES, ICONS } from "./icons.ts";

assert.deepEqual(Object.keys(ICONS), [...ICON_NAMES]);
for (const [name, icon] of Object.entries(ICONS)) {
  for (const path of [icon.fill, icon.detail, icon.line].filter(Boolean)) assert.match(path!, /^M-?\d/, name);
}

console.log("bears icons ok");
