// Prüft die Regeln aus CODING-RULES.md, die ESLint nicht abdeckt: Gedankenstrich, Sammelnamen,
// Kopfkommentar, ignorierte Ordnernamen, Importgrenzen zwischen Themes und Kern und dass jedes Logikmodul einen Check hat.
// Läuft automatisch mit npm test (wie jede *.check.ts).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { posix } from "node:path";

// Alle Dateien im Repo, auch neue, aber ohne das, was .gitignore ausschliesst
const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" })
  .split("\n")
  .filter(file => file && existsSync(file));

const TEXT = /\.(ts|tsx|js|css|html|json|md|yml|svg|example)$|Dockerfile$|Caddyfile$/;
const SOURCE = /^(src|server|scripts)\/.*\.(ts|tsx)$/;
const LOGIC = /^(src|server)\/.*(?<!\.check)\.ts$/;
// React-Hooks (Dateien use*.ts) brauchen einen Browser; ihre Logik steckt in geprüften reinen Modulen
const HOOK = /\/use[A-Z][^/]*\.ts$/;
// Module nur mit Typen (kein export const/function/class) haben nichts zu prüfen
const typesOnly = (file: string) => !/^export (const|let|function|async function|class|default)/m.test(readFileSync(file, "utf8"));

// Module ohne Check, mit Grund: nur Netzwerk, Ein- und Ausgabe im Browser und Einstiegspunkte.
// Ihre Logik steckt in geprüften reinen Modulen. Neue Einträge nur mit Begründung.
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

// Sammelnamen, die vor dem Regelwerk entstanden sind (leer: neue Ausnahmen nur mit Begründung)
const BAG_NAME_EXCEPTIONS: string[] = [];

// Als Zeichencode, damit diese Datei selbst kein Gedankenstrich enthält
const EM_DASH = String.fromCharCode(0x2014);

const failures: string[] = [];

// Regel 11: kein Gedankenstrich (U+2014) in irgendeiner Textdatei
for (const file of files.filter(file => TEXT.test(file))) {
  readFileSync(file, "utf8").split("\n").forEach((line, index) => {
    if (line.includes(EM_DASH)) failures.push(`${file}:${index + 1}: em dash (rule 11)`);
  });
}

// Regel 8: keine Sammelnamen für Dateien
for (const file of files.filter(file => SOURCE.test(file) && !BAG_NAME_EXCEPTIONS.includes(file))) {
  const name = file.split("/").pop()!.replace(/\.(check\.)?tsx?$/, "").toLowerCase();
  if (/(util|utils|helper|helpers|manager|common|misc)$/.test(name)) failures.push(`${file}: bag name (rule 8)`);
}

// Regel 14: jede Quelldatei beginnt mit einem Kommentar, der sagt, was sie ist
for (const file of files.filter(file => SOURCE.test(file))) {
  const first = readFileSync(file, "utf8").trimStart() // trimStart entfernt auch eine BOM;
  if (!first.startsWith("//") && !first.startsWith("/*")) failures.push(`${file}: missing file comment (rule 14)`);
}

// Regel 6: kein Quellordner heisst wie ein ignorierter Ordner
for (const file of files.filter(file => SOURCE.test(file))) {
  const folders = file.split("/").slice(1, -1);
  if (folders.some(folder => ["dist", "render", "data", "node_modules"].includes(folder))) failures.push(`${file}: git-ignored folder name (rule 6)`);
}

// Checks: jedes Logikmodul hat <name>.check.ts daneben, ausser Hooks, reine Typen oder mit Grund in WITHOUT_CHECK
for (const file of files.filter(file => LOGIC.test(file) && !HOOK.test(file) && !file.endsWith(".d.ts") && !typesOnly(file))) {
  if (!existsSync(file.replace(/\.ts$/, ".check.ts")) && !(file in WITHOUT_CHECK)) failures.push(`${file}: no ${file.replace(/^.*\//, "").replace(/\.ts$/, ".check.ts")} (checks)`);
}
for (const listed of Object.keys(WITHOUT_CHECK)) {
  if (!existsSync(listed)) failures.push(`scripts/rules.check.ts: WITHOUT_CHECK lists missing file ${listed}`);
}

// Regel 16: Overlay-Szenen und Themes präsentieren nur, Verbindungen laufen über die Kern-Hooks
const PRESENTING = /^src\/themes\/.*\.tsx?$/;
for (const file of files.filter(file => PRESENTING.test(file))) {
  readFileSync(file, "utf8").split("\n").forEach((line, index) => {
    if (/\bfetch\(|new EventSource\(|new WebSocket\(/.test(line)) failures.push(`${file}:${index + 1}: network access in a scene (rule 16)`);
  });
}

// Regel 16, Grenzen: ein Theme importiert nur aus seinem eigenen Ordner und aus src/core (Regeln, Hooks und Bausteine,
// die für alle Themes gleich sind), nie aus einem anderen Theme, dem Dashboard oder dem Server. Der Kern importiert nie
// aus Themes, Dashboard oder Server. Checks sind ausgenommen (sie dürfen z.B. schemaAudit nutzen).
const IMPORT_FROM = /^\s*(?:import|export)\b[^"';]*?["']([^"']+)["']/gm;
function importViolations(file: string, source: string): string[] {
  const theme = /^src\/themes\/([^/]+)\//.exec(file)?.[1];
  if ((!theme && !file.startsWith("src/core/")) || file.endsWith(".check.ts")) return [];
  return [...source.matchAll(IMPORT_FROM)].flatMap(([, specifier]) => {
    if (!specifier.startsWith(".")) return [];
    const target = posix.normalize(posix.join(posix.dirname(file), specifier));
    const allowed = theme ? target.startsWith(`src/themes/${theme}/`) || target.startsWith("src/core/") : !/^(src\/themes|src\/dashboard|server)\//.test(target);
    return allowed ? [] : [`${file}: imports ${specifier} (rule 16)`];
  });
}

// Selbsttest: eigener Ordner und Kern erlaubt, anderes Theme, Dashboard und Server nicht; der Kern nie nach oben
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

// Regel 20: Theme-Code ohne feste Gestaltungswerte. Farben, sichtbare Texte, Masse und Zeiten kommen aus den
// Einstellungen (src/themes/<id>/settings.ts, dort erlaubt). Gemeldet werden Farbliterale, sichtbarer JSX-Text,
// px/ms/s in CSS ausserhalb von var(--name, Standardwert) und Zahlen über 1 in Szenen ausser Indizes.
// JSX-Text zählt nur nach einem Tag-Ende; ">" nach Leerzeichen oder "=" ist ein Vergleich oder Pfeil.
// Ausnahme nur mit "fixed: <Grund>" im Kommentar auf derselben Zeile oder direkt darüber.
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

// Selbsttest der Erkennung: drei Funde, keiner für die fixed-Ausnahme, keiner für var()-Standardwerte und Indizes
assert.deepEqual(designLiterals("src/themes/probe/scenes/Probe.tsx", [
  "const color = \"#39FF14\";",
  "return <span>REC</span>;",
  "// fixed: Bühnengrösse",
  "const stage = 1920;",
  "const first = list[2] ?? 1;",
].join("\n")), ["src/themes/probe/scenes/Probe.tsx:1: color literal (rule 20)", "src/themes/probe/scenes/Probe.tsx:2: visible JSX text (rule 20)"]);
assert.deepEqual(designLiterals("src/themes/probe/theme.css", ".x { animation: blink 0.5s; }\n.y { width: var(--w, 10px); }"), ["src/themes/probe/theme.css:1: size or time outside var() (rule 20)"]);
assert.deepEqual(designLiterals("src/themes/probe/scenes/Probe.tsx", "const size = 1920;"), ["src/themes/probe/scenes/Probe.tsx:1: number 1920 (rule 20)"]);

for (const file of files.filter(file => THEME_CODE.test(file))) failures.push(...designLiterals(file, readFileSync(file, "utf8")));

// Testdateien heissen *.check.ts, damit npm test sie findet
for (const file of files.filter(file => /\.(test|spec)\.tsx?$/.test(file))) failures.push(`${file}: name checks <module>.check.ts`);

assert.deepEqual(failures, [], `Rule violations:\n${failures.join("\n")}`);
console.log(`rules ok (${files.length} files)`);
