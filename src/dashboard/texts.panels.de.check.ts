// Check for texts.panels.de.ts: texts with placeholders insert the values. Runs with npm test.
import assert from "node:assert/strict";
import { PANEL_TEXTS } from "./texts.panels.de.ts";

assert.ok(PANEL_TEXTS.empty("Matrix").includes("Matrix"));
assert.ok(PANEL_TEXTS.copyName("Regeln").startsWith("Regeln"));
assert.ok(PANEL_TEXTS.stage("Regeln").includes("Regeln"));
assert.ok(PANEL_TEXTS.downloaded("panel-1.png").includes("panel-1.png"));
assert.ok(PANEL_TEXTS.tooLarge("Regeln").includes("Regeln"));
assert.ok(PANEL_TEXTS.imageTooLarge("a.png").includes("a.png"));
assert.ok(PANEL_TEXTS.notAnImage("a.txt").includes("a.txt"));


console.log("texts panels ok");
