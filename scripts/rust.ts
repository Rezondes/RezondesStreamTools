// Prüft den Rust-Workspace server-rs/ (Teil von npm run verify): cargo fmt --check, clippy ohne Warnungen und die
// Tests. cargo liegt in der Git-Bash oft nicht im PATH, deshalb sucht findCargo erst CARGO, dann ~/.cargo/bin.
// In der CI ohne Rust-Toolchain (bis zum Umstieg, RUST-PLAN.md Package 45) wird mit Hinweis übersprungen.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// Pfad zu cargo; null, wenn es keins gibt. env, home und exists kommen von aussen, damit der Check sie setzen kann
export function findCargo(env: Record<string, string | undefined>, home: string, exists: (path: string) => boolean): string | null {
  if (env.CARGO) return env.CARGO;
  for (const name of ["cargo.exe", "cargo"]) {
    const candidate = join(home, ".cargo", "bin", name);
    if (exists(candidate)) return candidate;
  }
  const onPath = spawnSync("cargo", ["--version"], { encoding: "utf8" });
  return onPath.status === 0 ? "cargo" : null;
}

// Die drei Prüfungen in dieser Reihenfolge; die erste, die scheitert, beendet den Lauf
export const STEPS: readonly (readonly string[])[] = [
  ["fmt", "--all", "--check"],
  ["clippy", "--all-targets", "--quiet", "--", "-D", "warnings"],
  ["test", "--quiet"],
];

function main() {
  const cargo = findCargo(process.env, homedir(), existsSync);
  if (!cargo) {
    if (process.env.CI === "true") {
      console.log("Rust-Prüfung übersprungen: keine Rust-Toolchain in der CI");
      return;
    }
    console.error("cargo nicht gefunden: Rust installieren (rustup) oder CARGO setzen");
    process.exit(1);
  }
  for (const step of STEPS) {
    const run = spawnSync(cargo, step, { cwd: "server-rs", stdio: "inherit" });
    if (run.status !== 0) {
      console.error(`Rust-Prüfung fehlgeschlagen: cargo ${step.join(" ")}`);
      process.exit(run.status ?? 1);
    }
  }
}

if (import.meta.main) main();
