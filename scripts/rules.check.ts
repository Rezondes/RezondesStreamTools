// Checks the rules from CODING-RULES.md that ESLint does not cover: em dash, bag names,
// header comment, ignored folder names, import boundaries between themes and core, that every logic module has a check
// and that API types come from src/generated.
// Runs automatically with npm test (like every *.check.ts).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { posix } from "node:path";

// All files in the repo, new ones too, but without what .gitignore excludes
const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" })
  .split("\n")
  .filter(file => file && existsSync(file));

const TEXT = /\.(ts|tsx|js|css|html|json|md|yml|svg|example)$|Dockerfile$|Caddyfile$/;
const SOURCE = /^(src|server|scripts)\/.*\.(ts|tsx)$/;
const LOGIC = /^(src|server)\/.*(?<!\.check)\.ts$/;
// React hooks (files use*.ts) need a browser; their logic is in checked pure modules
const HOOK = /\/use[A-Z][^/]*\.ts$/;
// Modules with types only (no export const/function/class) have nothing to check
const typesOnly = (file: string) => !/^export (const|let|function|async function|class|default)/m.test(readFileSync(file, "utf8"));

// Modules without a check, with a reason: only network, input and output in the browser and entry points.
// Their logic is in checked pure modules. New entries only with a reason.
const WITHOUT_CHECK: Record<string, string> = {
  "src/core/connection.ts": "network client (IRC, SSE); translation is checked in ircEvents.ts",
  "src/core/emotes.ts": "network loader; splitting is checked in irc.ts",
  "src/core/demo.ts": "timer-driven fake event source for ?demo, stands in for the network",
  "src/core/params.ts": "reads the page URL once at load (browser entry)",
  "src/core/sound.ts": "Web Audio output",
  "src/themes/matrix/tones.ts": "Web Audio output",
  "src/themes/suedfrucht/tones.ts": "Web Audio output",
  "src/dashboard/api.ts": "network client of the dashboard",
  "server/index.ts": "HTTP entry point",
  "server/chat.ts": "network client; parsing is checked in irc.ts",
  "server/renderRoutes.ts": "HTTP handlers and the ffmpeg process; job rules and arguments are checked in render.ts",
  "server/streamer.ts": "runtime wiring of the checked clients (twitch, spotify, triggers, chat) with timers and SSE",
};

// Bag names that arose before the rule set (empty: new exceptions only with a reason)
const BAG_NAME_EXCEPTIONS: string[] = [];

// As a character code, so this file itself contains no em dash
const EM_DASH = String.fromCharCode(0x2014);

const failures: string[] = [];

// Rule 11: no em dash (U+2014) in any text file
for (const file of files.filter(file => TEXT.test(file))) {
  readFileSync(file, "utf8").split("\n").forEach((line, index) => {
    if (line.includes(EM_DASH)) failures.push(`${file}:${index + 1}: em dash (rule 11)`);
  });
}

// Rule 8: no bag names for files
for (const file of files.filter(file => SOURCE.test(file) && !BAG_NAME_EXCEPTIONS.includes(file))) {
  const name = file.split("/").pop()!.replace(/\.(check\.)?tsx?$/, "").toLowerCase();
  if (/(util|utils|helper|helpers|manager|common|misc)$/.test(name)) failures.push(`${file}: bag name (rule 8)`);
}

// Rule 14: every source file starts with a comment that says what it is
for (const file of files.filter(file => SOURCE.test(file))) {
  const first = readFileSync(file, "utf8").trimStart() // trimStart also removes a BOM;
  if (!first.startsWith("//") && !first.startsWith("/*")) failures.push(`${file}: missing file comment (rule 14)`);
}

// Rule 6: no source folder is named like an ignored folder
for (const file of files.filter(file => SOURCE.test(file))) {
  const folders = file.split("/").slice(1, -1);
  if (folders.some(folder => ["dist", "render", "data", "node_modules"].includes(folder))) failures.push(`${file}: git-ignored folder name (rule 6)`);
}

// Checks: every logic module has <name>.check.ts next to it, except hooks, pure types or with a reason in WITHOUT_CHECK
for (const file of files.filter(file => LOGIC.test(file) && !HOOK.test(file) && !file.endsWith(".d.ts") && !typesOnly(file))) {
  if (!existsSync(file.replace(/\.ts$/, ".check.ts")) && !(file in WITHOUT_CHECK)) failures.push(`${file}: no ${file.replace(/^.*\//, "").replace(/\.ts$/, ".check.ts")} (checks)`);
}
for (const listed of Object.keys(WITHOUT_CHECK)) {
  if (!existsSync(listed)) failures.push(`scripts/rules.check.ts: WITHOUT_CHECK lists missing file ${listed}`);
}

// Rule 16: overlay scenes and themes only present, connections run through the core hooks
const PRESENTING = /^src\/themes\/.*\.tsx?$/;
for (const file of files.filter(file => PRESENTING.test(file))) {
  readFileSync(file, "utf8").split("\n").forEach((line, index) => {
    if (/\bfetch\(|new EventSource\(|new WebSocket\(/.test(line)) failures.push(`${file}:${index + 1}: network access in a scene (rule 16)`);
  });
}

// Rule 16, boundaries: a theme imports only from its own folder, from src/core (rules, hooks and building blocks
// that are the same for all themes) and the generated types, never from another theme, the dashboard or the server.
// The core never imports from themes, dashboard or server. Checks are exempt (they may use schemaAudit, for example).
const IMPORT_FROM = /^\s*(?:import|export)\b[^"';]*?["']([^"']+)["']/gm;
function importViolations(file: string, source: string): string[] {
  const theme = /^src\/themes\/([^/]+)\//.exec(file)?.[1];
  if ((!theme && !file.startsWith("src/core/")) || file.endsWith(".check.ts")) return [];
  return [...source.matchAll(IMPORT_FROM)].flatMap(([, specifier]) => {
    if (!specifier.startsWith(".")) return [];
    const target = posix.normalize(posix.join(posix.dirname(file), specifier));
    const shared = target.startsWith("src/core/") || target.startsWith("src/generated/");
    const allowed = theme ? target.startsWith(`src/themes/${theme}/`) || shared : !/^(src\/themes|src\/dashboard|server)\//.test(target);
    return allowed ? [] : [`${file}: imports ${specifier} (rule 16)`];
  });
}

// Self test: own folder and core allowed, another theme, dashboard and server not; the core never upwards
assert.deepEqual(importViolations("src/themes/probe/scenes/A.tsx", [
  "import { useProbe } from \"../useProbe.ts\";",
  "import Marquee from \"../../../core/music/Marquee.tsx\";",
  "import { useState } from \"react\";",
  "import { x } from \"../../matrix/settings.ts\";",
  "import {\n  y,\n} from \"../../../dashboard/api.ts\";",
].join("\n")), ["src/themes/probe/scenes/A.tsx: imports ../../matrix/settings.ts (rule 16)", "src/themes/probe/scenes/A.tsx: imports ../../../dashboard/api.ts (rule 16)"]);
assert.deepEqual(importViolations("src/core/music/a.ts", "import { THEMES } from \"../../themes/registry.ts\";"), ["src/core/music/a.ts: imports ../../themes/registry.ts (rule 16)"]);
assert.deepEqual(importViolations("src/themes/probe/settings.check.ts", "import { auditTheme } from \"../schemaAudit.ts\";"), []);

for (const file of files.filter(file => SOURCE.test(file))) failures.push(...importViolations(file, readFileSync(file, "utf8")));

// Rule 20: theme code without fixed design values. Colors, visible texts, sizes and times come from the
// settings (src/themes/<id>/settings.ts, allowed there). Reported are color literals, visible JSX text,
// px/ms/s in CSS outside of var(--name, default) and numbers above 1 in scenes except indices.
// JSX text only counts after a tag end; ">" after a space or "=" is a comparison or arrow.
// Exception only with "fixed: <reason>" in the comment on the same line or directly above.
const COLOR_LITERAL = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i;
const VISIBLE = /[\p{L}\p{N}\p{So}]/u;
const CSS_SIZE = /(?<![\w-])-?(\d+\.?\d*|\.\d+)(px|ms|s)\b/;
const VAR_DEFAULT = /var\(--[\w-]+,[^()]*\)/g;
const THEME_CODE = /^src\/themes\/[^/]+\/(?!settings\.ts$).*(?<!\.check)\.(ts|tsx|css)$/;

function designLiterals(file: string, source: string): string[] {
  const found: string[] = [];
  const lines = source.split("\n");
  const scene = /\/scenes\/[^/]+\.tsx$/.test(file);
  lines.forEach((line, index) => {
    if (line.includes("fixed:") || lines[index - 1]?.includes("fixed:")) return;
    const where = `${file}:${index + 1}`;
    const code = line.replace(/\/\*.*?\*\//g, "").replace(/(^|\s)\/\/.*$/, "");
    if (COLOR_LITERAL.test(code)) found.push(`${where}: color literal (rule 20)`);
    if (file.endsWith(".css")) {
      if (CSS_SIZE.test(code.replace(VAR_DEFAULT, ""))) found.push(`${where}: size or time outside var() (rule 20)`);
      return;
    }
    if (file.endsWith(".tsx") && [...code.matchAll(/(?<![\s=])>([^<>{}]+)</g)].some(match => VISIBLE.test(match[1]))) found.push(`${where}: visible JSX text (rule 20)`);
    if (!scene) return;
    const numbers = code.replace(/"[^"]*"|'[^']*'|`[^`]*`/g, "").replace(/\[\d+\]/g, "");
    for (const match of numbers.matchAll(/(?<![\w.])\d[\d_]*(\.\d+)?/g)) {
      if (Number(match[0].replaceAll("_", "")) > 1) found.push(`${where}: number ${match[0]} (rule 20)`);
    }
  });
  return found;
}

// Self test of the detection: three findings, none for the fixed exception, none for var() defaults and indices
assert.deepEqual(designLiterals("src/themes/probe/scenes/Probe.tsx", [
  "const color = \"#39FF14\";",
  "return <span>REC</span>;",
  "// fixed: stage size",
  "const stage = 1920;",
  "const first = list[2] ?? 1;",
].join("\n")), ["src/themes/probe/scenes/Probe.tsx:1: color literal (rule 20)", "src/themes/probe/scenes/Probe.tsx:2: visible JSX text (rule 20)"]);
assert.deepEqual(designLiterals("src/themes/probe/theme.css", ".x { animation: blink 0.5s; }\n.y { width: var(--w, 10px); }"), ["src/themes/probe/theme.css:1: size or time outside var() (rule 20)"]);
assert.deepEqual(designLiterals("src/themes/probe/scenes/Probe.tsx", "const size = 1920;"), ["src/themes/probe/scenes/Probe.tsx:1: number 1920 (rule 20)"]);

for (const file of files.filter(file => THEME_CODE.test(file))) failures.push(...designLiterals(file, readFileSync(file, "utf8")));

// API types come from the Rust server (src/generated, npm run gen:types): no hand-written type of the same name in the
// frontend. Exceptions: the theme authoring types, whose wire form is the generated one and assignable to them.
const GENERATED_TYPES = new Set(files.filter(file => /^src\/generated\/[^/]+\.ts$/.test(file)).map(file => posix.basename(file, ".ts")));
const AUTHORING_TYPES: Record<string, string[]> = {
  "src/core/theme.ts": ["SettingField", "ThemeSchema", "MinimeVariantSet", "MinimeVariantInfo"],
};
function ownApiTypes(file: string, text: string, generated: ReadonlySet<string>): string[] {
  return [...text.matchAll(/^\s*(?:export\s+)?(?:type|interface)\s+(\w+)/gm)]
    .map(match => match[1])
    .filter(name => generated.has(name) && !(AUTHORING_TYPES[file] ?? []).includes(name))
    .map(name => `${file}: own type ${name}, use src/generated/${name}.ts`);
}
assert.deepEqual(ownApiTypes("src/core/probe.ts", "export type Track = { id: string };\ntype Local = number;", new Set(["Track"])), ["src/core/probe.ts: own type Track, use src/generated/Track.ts"]);
assert.deepEqual(ownApiTypes("src/core/theme.ts", "export type ThemeSchema = { id: string };", new Set(["ThemeSchema"])), []);
for (const file of files.filter(file => /^src\/.*\.tsx?$/.test(file) && !file.startsWith("src/generated/"))) {
  failures.push(...ownApiTypes(file, readFileSync(file, "utf8"), GENERATED_TYPES));
}

// Test files are called *.check.ts so npm test finds them
for (const file of files.filter(file => /\.(test|spec)\.tsx?$/.test(file))) failures.push(`${file}: name checks <module>.check.ts`);

assert.deepEqual(failures, [], `Rule violations:\n${failures.join("\n")}`);
console.log(`rules ok (${files.length} files)`);
