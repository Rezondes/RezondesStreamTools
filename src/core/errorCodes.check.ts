// Check for errorCodes.ts: codes unique, settings codes part of the full list, isErrorCode only recognizes known ones.
// Runs with npm test.
import assert from "node:assert/strict";
import { ERROR_CODES, isErrorCode, SETTING_ERROR_CODES } from "./errorCodes.ts";

assert.equal(new Set(ERROR_CODES).size, ERROR_CODES.length);
assert.ok(SETTING_ERROR_CODES.every(code => (ERROR_CODES as readonly string[]).includes(code)));
assert.ok(isErrorCode("not-connected"));
assert.ok(isErrorCode("invalid_color"));
assert.ok(!isErrorCode("<script>"));
assert.ok(!isErrorCode(""));

console.log("errorCodes ok");
