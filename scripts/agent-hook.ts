// Claude Code hooks of this project (registered in .claude/settings.json):
//   node scripts/agent-hook.ts edit  after every file change: ESLint on the changed file
//   node scripts/agent-hook.ts stop  before answering: npm run verify if source code changed
// Exit code 2 returns the errors to the agent, which then has to fix them.
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { relative } from "node:path";

type HookInput = { tool_input?: { file_path?: string }; stop_hook_active?: boolean };

const mode = process.argv[2];
const input = JSON.parse(readFileSync(0, "utf8") || "{}") as HookInput;
// Start ESLint directly via Node: no shell needed, also on Windows
const eslint = "node_modules/eslint/bin/eslint.js";

function fail(output: string) {
  process.stderr.write(output.split("\n").slice(-40).join("\n"));
  process.exit(2);
}

if (mode === "edit") {
  const file = relative(process.cwd(), input.tool_input?.file_path ?? "").replaceAll("\\", "/");
  if (!/^(src|server|scripts)\/.*\.(ts|tsx)$/.test(file) && !/^(vite|eslint)\.config\.(ts|js)$/.test(file)) process.exit(0);
  const lint = spawnSync(process.execPath, [eslint, "--max-warnings", "0", file], { encoding: "utf8" });
  if (lint.status !== 0) fail(`ESLint finds rule violations in ${file} (CODING-RULES.md):\n${lint.stdout}${lint.stderr}`);
} else if (mode === "stop") {
  // A second stop after a failure is let through, so no endless loop arises
  if (input.stop_hook_active) process.exit(0);
  const changed = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" })
    .split("\n")
    .some(line => /\.(ts|tsx|css|js|json)$/.test(line.trim()));
  if (!changed) process.exit(0);
  // Fixed command without input from outside, so the shell is harmless here
  const verify = spawnSync("npm run verify", { encoding: "utf8", shell: true });
  if (verify.status !== 0) fail(`npm run verify fails. Please fix:\n${verify.stdout}${verify.stderr}`);
}
