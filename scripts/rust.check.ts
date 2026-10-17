// Check for rust.ts: cargo is found via CARGO or ~/.cargo/bin, the checks run in a fixed order.
// Runs with npm test.
import assert from "node:assert/strict";
import { join } from "node:path";
import { BUILD, findCargo, GEN_TYPES, SERVE, STEPS } from "./rust.ts";

const home = join("home", "neo");
const exe = join(home, ".cargo", "bin", "cargo.exe");
const plain = join(home, ".cargo", "bin", "cargo");

// CARGO always wins
assert.equal(findCargo({ CARGO: "C:/rust/cargo.exe" }, home, () => true), "C:/rust/cargo.exe");
// Otherwise ~/.cargo/bin, on Windows cargo.exe first
assert.equal(findCargo({}, home, path => path === exe), exe);
assert.equal(findCargo({}, home, path => path === plain), plain);

// Format first, then clippy without warnings, then tests
assert.deepEqual(STEPS.map(step => step[0]), ["fmt", "clippy", "test"]);
assert.ok(STEPS[1].includes("-D") && STEPS[1].includes("warnings"));

// gen:types only runs the ignored write test
assert.ok(GEN_TYPES[0].includes("--ignored") && GEN_TYPES[0].includes("write_generated_files"));
// build only builds the server binary for the contract tests
assert.deepEqual(BUILD, [["build", "--quiet", "-p", "rst-server"]]);
// serve starts the release build of the server
assert.deepEqual(SERVE, [["run", "--release", "-p", "rst-server", "--", "serve"]]);

console.log("rust ok");
