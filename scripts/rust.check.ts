// Check für rust.ts: cargo wird über CARGO oder ~/.cargo/bin gefunden, die Prüfungen laufen in fester Reihenfolge.
// Läuft mit npm test.
import assert from "node:assert/strict";
import { join } from "node:path";
import { findCargo, STEPS } from "./rust.ts";

const home = join("home", "neo");
const exe = join(home, ".cargo", "bin", "cargo.exe");
const plain = join(home, ".cargo", "bin", "cargo");

// CARGO gewinnt immer
assert.equal(findCargo({ CARGO: "C:/rust/cargo.exe" }, home, () => true), "C:/rust/cargo.exe");
// Sonst ~/.cargo/bin, unter Windows cargo.exe zuerst
assert.equal(findCargo({}, home, path => path === exe), exe);
assert.equal(findCargo({}, home, path => path === plain), plain);

// Erst Format, dann clippy ohne Warnungen, dann Tests
assert.deepEqual(STEPS.map(step => step[0]), ["fmt", "clippy", "test"]);
assert.ok(STEPS[1].includes("-D") && STEPS[1].includes("warnings"));

console.log("rust ok");
