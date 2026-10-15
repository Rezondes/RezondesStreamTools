// Claude-Code-Hooks dieses Projekts (eingetragen in .claude/settings.json):
//   node scripts/agent-hook.ts edit  nach jeder Dateiänderung: ESLint auf die geänderte Datei
//   node scripts/agent-hook.ts stop  vor dem Antworten: npm run verify, wenn Quellcode geändert ist
// Exit-Code 2 gibt die Fehler an den Agenten zurück, der sie dann beheben muss.
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { relative } from "node:path";

type HookInput = { tool_input?: { file_path?: string }; stop_hook_active?: boolean };

const mode = process.argv[2];
const input = JSON.parse(readFileSync(0, "utf8") || "{}") as HookInput;
// ESLint direkt über Node starten: keine Shell nötig, auch unter Windows
const eslint = "node_modules/eslint/bin/eslint.js";

function fail(output: string) {
  process.stderr.write(output.split("\n").slice(-40).join("\n"));
  process.exit(2);
}

if (mode === "edit") {
  const file = relative(process.cwd(), input.tool_input?.file_path ?? "").replaceAll("\\", "/");
  if (!/^(src|server|scripts)\/.*\.(ts|tsx)$/.test(file) && !/^(vite|eslint)\.config\.(ts|js)$/.test(file)) process.exit(0);
  const lint = spawnSync(process.execPath, [eslint, "--max-warnings", "0", file], { encoding: "utf8" });
  if (lint.status !== 0) fail(`ESLint findet Regelverstösse in ${file} (CODING-RULES.md):\n${lint.stdout}${lint.stderr}`);
} else if (mode === "stop") {
  // Ein zweiter Stopp nach einem Fehlschlag wird durchgelassen, damit keine Endlosschleife entsteht
  if (input.stop_hook_active) process.exit(0);
  const changed = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" })
    .split("\n")
    .some(line => /\.(ts|tsx|css|js|json)$/.test(line.trim()));
  if (!changed) process.exit(0);
  // Fester Befehl ohne Eingaben von aussen, darum ist die Shell hier unbedenklich
  const verify = spawnSync("npm run verify", { encoding: "utf8", shell: true });
  if (verify.status !== 0) fail(`npm run verify schlägt fehl. Bitte beheben:\n${verify.stdout}${verify.stderr}`);
}
