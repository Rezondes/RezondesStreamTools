// Check for bundle.ts: optional modules are found in the entry chunk and in chunks of themes that must not load them,
// and allowed in the chunks of the themes that use them. Runs with npm test.
import assert from "node:assert/strict";
import { bundleViolations, type BundleChunk } from "./bundle.ts";

const chunk = (file: string, facade: string | null, imports: string[], packages: string[], entry = false): BundleChunk => ({ file, entry, facade, imports, packages });

// The entry imports a chunk with three: one finding with the root and the chunk
assert.deepEqual(
  bundleViolations([chunk("index.js", "index.html", ["vendor.js"], ["react"], true), chunk("vendor.js", null, [], ["three"])]),
  ["index.html: three (via vendor.js)"],
);

// Only the chunk of the new theme imports three: no finding
assert.deepEqual(
  bundleViolations([
    chunk("index.js", "index.html", [], ["react"], true),
    chunk("Starting.js", "src/themes/dachdecker/scenes/Starting.tsx", ["three.js"], []),
    chunk("three.js", null, [], ["three", "@react-three/fiber"]),
  ], ["three", "@react-three/fiber"], ["dachdecker"]),
  [],
);

// An existing theme that reaches gsap through a shared chunk is a finding; cycles in the imports end
assert.deepEqual(
  bundleViolations([
    chunk("Alerts.js", "src/themes/chaos/scenes/Alerts.tsx", ["shared.js"], []),
    chunk("shared.js", null, ["gsap.js", "Alerts.js"], []),
    chunk("gsap.js", null, ["shared.js"], ["gsap"]),
  ], ["gsap"], ["dachdecker"]),
  ["src/themes/chaos/scenes/Alerts.tsx: gsap (via gsap.js)"],
);

// Modules in modernized themes: allowed in the chunks of these themes, still a finding in the entry chunk and in the
// chunk of a theme outside the default allow list
const modernized = ["koth", "plantage", "chaos", "bears", "urlaub", "matrix", "standard"];
assert.deepEqual(
  bundleViolations([
    chunk("index.js", "index.html", [], ["react"], true),
    ...modernized.map(theme => chunk(`${theme}.js`, `src/themes/${theme}/scenes/Starting.tsx`, ["pixi.js"], [])),
    chunk("pixi.js", null, [], ["pixi.js", "gsap"]),
  ]),
  [],
);
assert.deepEqual(
  bundleViolations([
    chunk("index.js", "index.html", ["pixi.js"], [], true),
    chunk("Starting.js", "src/themes/probe/scenes/Starting.tsx", ["pixi.js"], []),
    chunk("pixi.js", null, [], ["pixi.js"]),
  ]),
  ["index.html: pixi.js (via pixi.js)", "src/themes/probe/scenes/Starting.tsx: pixi.js (via pixi.js)"],
);

// Chunks outside themes that are no entry (dashboard parts loaded lazily) are no roots
assert.deepEqual(bundleViolations([chunk("Render.js", "src/dashboard/Render.tsx", [], ["gsap"])], ["gsap"], []), []);

console.log("bundle ok");
