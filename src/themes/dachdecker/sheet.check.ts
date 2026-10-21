// Check for sheet.ts of the Dachdecker theme: the blueprint carries title, subtitle, the dimensions in metres, the
// markers, the notes numbered, the title block split at | and the stamp; empty texts are left out. Runs with npm test.
import assert from "node:assert/strict";
import { drawSheet } from "./sheet.ts";

const record = () => {
  const texts: string[] = [];
  const context = new Proxy({}, {
    get: (_, key: string) => (key === "fillText" ? (text: string) => texts.push(text) : key === "measureText" ? () => ({ width: 100 }) : () => {}),
    set: () => true,
  }) as unknown as CanvasRenderingContext2D;
  return { texts, context };
};
const colors = { blueprint: "#192a56", line: "#ffffff", accent: "#e67e22", copper: "#d4a373", muted: "#b4c2e0", brick: "#d35400" };
const options = {
  width: 1920, height: 1080, grid: 40, font: "Roboto Mono", colors, title: "NEO", subtitle: "PLAN", span: 8.4, rise: 3.25,
  block: ["BAUHERR | NEO", "BLATT"], notes: ["MASSE IN METERN", ""], stamp: "GEPRÜFT",
};
const full = record();
drawSheet(full.context, options);
assert.deepEqual(full.texts, ["NEO", "PLAN", "8,40 m", "3,25 m", "A", "N", "1. MASSE IN METERN", "BAUHERR", "NEO", "BLATT", "GEPRÜFT"]);

const empty = record();
drawSheet(empty.context, { ...options, title: "", subtitle: "", block: [], notes: [], stamp: "" });
assert.deepEqual(empty.texts, ["8,40 m", "3,25 m", "A", "N"]);

console.log("dachdecker sheet ok");
