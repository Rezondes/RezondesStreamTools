// Bundle check after vite build (plans/PLAN-GRAFIK.md, package 1): the graphics and animation modules must not end up in
// the entry chunk or in the chunks of themes that do not use them. vite.config.ts writes the chunk map
// (BUNDLE_MAP_FILE) with the packages of every chunk; this script follows the static imports from every root.
import { existsSync, readFileSync } from "node:fs";

export const BUNDLE_MAP_FILE = "node_modules/.cache/bundle-map.json";

// Modules that only themes load which use them on purpose
export const OPTIONAL_PACKAGES = [
  "three", "@react-three/fiber", "@react-three/drei", "@react-three/postprocessing", "postprocessing",
  "gsap", "@gsap/react", "pixi.js", "roughjs",
];

// Themes that may load the modules above
export const MODULE_THEMES = ["dachdecker", "kebab", "koth", "plantage", "chaos", "bears", "urlaub", "matrix", "standard"];

export type BundleChunk = {
  file: string;
  entry: boolean;
  facade: string | null; // source module the chunk stands for, relative with forward slashes
  imports: string[]; // static imports (files of other chunks)
  packages: string[];
};

// "src/themes/chaos/scenes/Alerts.tsx" gives "chaos"
const themeOf = (facade: string | null) => facade?.match(/^src\/themes\/([^/]+)\//)?.[1] ?? null;

function closure(start: string, byFile: Map<string, BundleChunk>): BundleChunk[] {
  const seen = new Set<string>();
  const queue = [start];
  const result: BundleChunk[] = [];
  while (queue.length > 0) {
    const file = queue.pop()!;
    const chunk = byFile.get(file);
    if (seen.has(file) || !chunk) continue;
    seen.add(file);
    result.push(chunk);
    queue.push(...chunk.imports);
  }
  return result;
}

// Findings as "<root>: <package> (via <chunk>)"
export function bundleViolations(chunks: readonly BundleChunk[], forbidden = OPTIONAL_PACKAGES, allowedThemes = MODULE_THEMES): string[] {
  const byFile = new Map(chunks.map(chunk => [chunk.file, chunk]));
  const roots = chunks.filter(chunk => {
    const theme = themeOf(chunk.facade);
    return chunk.entry || (theme !== null && !allowedThemes.includes(theme));
  });
  const findings = new Set<string>();
  for (const root of roots) {
    for (const chunk of closure(root.file, byFile)) {
      for (const name of chunk.packages.filter(name => forbidden.includes(name))) findings.add(`${root.facade ?? root.file}: ${name} (via ${chunk.file})`);
    }
  }
  return [...findings].sort();
}

if (import.meta.main) {
  if (!existsSync(BUNDLE_MAP_FILE)) {
    console.error(`bundle: ${BUNDLE_MAP_FILE} missing, run vite build first`);
    process.exit(1);
  }
  const findings = bundleViolations(JSON.parse(readFileSync(BUNDLE_MAP_FILE, "utf8")) as BundleChunk[]);
  if (findings.length > 0) {
    console.error(["bundle: optional modules in chunks that must not load them:", ...findings].join("\n  "));
    process.exit(1);
  }
  console.log("bundle ok");
}
