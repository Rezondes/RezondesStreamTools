// Checks the Rust workspace server-rs/ (part of npm run verify): cargo fmt --check, clippy without warnings and the
// tests; also builds the server for the contract tests, writes the generated types and starts the server (npm run
// server). In Git Bash cargo is often missing from PATH, so findCargo tries CARGO first, then ~/.cargo/bin.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// Path to cargo; null if there is none. env, home and exists are passed in so the check can set them
export function findCargo(env: Record<string, string | undefined>, home: string, exists: (path: string) => boolean): string | null {
  if (env.CARGO) return env.CARGO;
  for (const name of ["cargo.exe", "cargo"]) {
    const candidate = join(home, ".cargo", "bin", name);
    if (exists(candidate)) return candidate;
  }
  const onPath = spawnSync("cargo", ["--version"], { encoding: "utf8" });
  return onPath.status === 0 ? "cargo" : null;
}

// The three checks in this order; the first one that fails ends the run
export const STEPS: readonly (readonly string[])[] = [
  ["fmt", "--all", "--check"],
  ["clippy", "--all-targets", "--quiet", "--", "-D", "warnings"],
  ["test", "--quiet"],
];
// npm run gen:types: rewrites src/generated/ (ignored test in rst-app/tests/export_types.rs)
export const GEN_TYPES: readonly (readonly string[])[] = [
  ["test", "--quiet", "-p", "rst-app", "--test", "export_types", "--", "--ignored", "write_generated_files"],
];
// npm run contract: builds the binary rst that the contract tests start
export const BUILD: readonly (readonly string[])[] = [["build", "--quiet", "-p", "rst-server"]];
// npm run server: the server with the environment of server.env (node --env-file)
export const SERVE: readonly (readonly string[])[] = [["run", "--release", "-p", "rst-server", "--", "serve"]];

const COMMANDS: Record<string, readonly (readonly string[])[]> = { "gen:types": GEN_TYPES, build: BUILD, serve: SERVE };

function main() {
  const cargo = findCargo(process.env, homedir(), existsSync);
  if (!cargo) {
    console.error("cargo not found: install Rust (rustup) or set CARGO");
    process.exit(1);
  }
  for (const step of COMMANDS[process.argv[2] ?? ""] ?? STEPS) {
    const run = spawnSync(cargo, step, { cwd: "server-rs", stdio: "inherit" });
    if (run.status !== 0) {
      console.error(`Rust check failed: cargo ${step.join(" ")}`);
      process.exit(run.status ?? 1);
    }
  }
}

if (import.meta.main) main();
