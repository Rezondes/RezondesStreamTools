// Checks the Rust workspace server-rs/ (part of npm run verify): cargo fmt --check, clippy without warnings and the
// tests. In Git Bash cargo is often missing from PATH, so findCargo tries CARGO first, then ~/.cargo/bin.
// In CI without a Rust toolchain (until the switchover, RUST-PLAN.md package 45) it is skipped with a note.
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
// npm run contract:rust: builds the binary rst that the contract tests start
export const BUILD: readonly (readonly string[])[] = [["build", "--quiet", "-p", "rst-server"]];

function main() {
  const cargo = findCargo(process.env, homedir(), existsSync);
  if (!cargo) {
    if (process.env.CI === "true") {
      console.log("Rust check skipped: no Rust toolchain in CI");
      return;
    }
    console.error("cargo not found: install Rust (rustup) or set CARGO");
    process.exit(1);
  }
  const command = process.argv[2];
  for (const step of command === "gen:types" ? GEN_TYPES : command === "build" ? BUILD : STEPS) {
    const run = spawnSync(cargo, step, { cwd: "server-rs", stdio: "inherit" });
    if (run.status !== 0) {
      console.error(`Rust check failed: cargo ${step.join(" ")}`);
      process.exit(run.status ?? 1);
    }
  }
}

if (import.meta.main) main();
