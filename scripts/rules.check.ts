// Prüft die Regeln aus CODING-RULES.md, die ESLint nicht abdeckt: Gedankenstrich, Sammelnamen,
// Kopfkommentar, ignorierte Ordnernamen und dass jedes Logikmodul einen Check hat.
// Läuft automatisch mit npm test (wie jede *.check.ts).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

// Alle Dateien im Repo, auch neue, aber ohne das, was .gitignore ausschliesst
const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" })
  .split("\n")
  .filter(file => file && existsSync(file));

const TEXT = /\.(ts|tsx|js|css|html|json|md|yml|svg|example)$|Dockerfile$/;
const SOURCE = /^(src|server|scripts)\/.*\.(ts|tsx)$/;
// React-Hooks (src/core/hooks) brauchen einen Browser; ihre Logik steckt in geprüften reinen Modulen
const LOGIC = /^(src|server)\/(?!core\/hooks\/).*(?<!\.check)\.ts$/;

// Logikmodule ohne Check, mit Grund. Neue Einträge nur mit Begründung (ponytail: Liste schrumpft beim Umbau).
const WITHOUT_CHECK: Record<string, string> = {
  "src/core/connection.ts": "network client (IRC, SSE); translation is checked in ircEvents.ts",
  "src/core/demo.ts": "random fake events for ?demo",
  "src/core/glyphs.ts": "random character pick",
  "src/core/params.ts": "reads the page URL",
  "src/core/sound.ts": "Web Audio output",
  "src/core/types.ts": "types only",
  "src/core/theme.ts": "types only",
  "src/core/emotes.ts": "network loader; splitting is checked in irc.ts",
  "src/themes/matrix/banners.ts": "canvas renderer; checked manually on #/stinger",
  "src/themes/matrix/values.ts": "typed view of the theme context; typing comes from settings.ts",
  "src/themes/matrix/decode.ts": "React hook over core useDecode with a timing table",
  "src/themes/matrix/tones.ts": "Web Audio output",
  "server/index.ts": "HTTP entry point",
  "server/chat.ts": "network client; parsing is checked in irc.ts",
  "server/http.ts": "HTTP and file IO helpers",
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

// Checks: jedes Logikmodul hat <name>.check.ts daneben, ausser es steht mit Grund in WITHOUT_CHECK
for (const file of files.filter(file => LOGIC.test(file) && !file.endsWith(".d.ts"))) {
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
