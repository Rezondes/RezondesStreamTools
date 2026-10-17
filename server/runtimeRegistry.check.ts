// Check for runtimeRegistry.ts: one runtime per login, overtaken or meanwhile locked starts are
// discarded and stopped. Runs with npm test.
import assert from "node:assert/strict";
import { runtimeRegistry } from "./runtimeRegistry.ts";

type Fake = { id: number; stopped: boolean; stop: () => void };
let nextId = 1;
const fake = (): Fake => {
  const runtime: Fake = { id: nextId++, stopped: false, stop: () => { runtime.stopped = true; } };
  return runtime;
};
// A start whose setup only finishes on release() (like reading files and opening connections)
function held() {
  let release: () => void = () => {};
  const runtime = fake();
  const create = () => new Promise<Fake>(resolve => { release = () => resolve(runtime); });
  return { runtime, create, release: () => release() };
}

const registry = runtimeRegistry<Fake>();
let allowed = true;

// Normal start, a restart stops the old runtime
const first = await registry.start("neo", () => Promise.resolve(fake()), () => allowed);
assert.ok(first);
const second = await registry.start("neo", () => Promise.resolve(fake()), () => allowed);
assert.equal(first.stopped, true);
assert.equal(registry.get("neo"), second);
assert.deepEqual(registry.logins(), ["neo"]);

// Two starts at once (two logins): only the newer one stays, the older one is stopped, never two
const older = held();
const newer = held();
const startOlder = registry.start("trinity", older.create, () => allowed);
const startNewer = registry.start("trinity", newer.create, () => allowed);
newer.release();
older.release();
assert.equal(await startOlder, null);
assert.equal(await startNewer, newer.runtime);
assert.equal(older.runtime.stopped, true);
assert.equal(registry.get("trinity"), newer.runtime);

// Locked while the start runs (admin saves access): the new runtime is stopped, none is managed
const revoked = held();
const startRevoked = registry.start("morpheus", revoked.create, () => allowed);
allowed = false;
registry.stop("morpheus");
revoked.release();
assert.equal(await startRevoked, null);
assert.equal(revoked.runtime.stopped, true);
assert.equal(registry.get("morpheus"), undefined);
allowed = true;

// Only the access is revoked (the start is not in the list yet, the lock does not see it): discarded
const unlisted = held();
const startUnlisted = registry.start("niobe", unlisted.create, () => allowed);
allowed = false;
unlisted.release();
assert.equal(await startUnlisted, null);
assert.equal(unlisted.runtime.stopped, true);
allowed = true;

// stopAll also catches running starts
const pending = held();
const startPending = registry.start("oracle", pending.create, () => allowed);
registry.stopAll();
pending.release();
assert.equal(await startPending, null);
assert.equal(pending.runtime.stopped, true);
assert.equal(registry.count(), 0);

// Nothing to start (no tokens); an ended runtime only removes itself if it is still current
assert.equal(await registry.start("neo", () => Promise.resolve(null), () => allowed), null);
const current = await registry.start("neo", () => Promise.resolve(fake()), () => allowed);
assert.ok(current);
registry.ended("neo", fake());
assert.equal(registry.get("neo"), current);
registry.ended("neo", current);
assert.equal(registry.get("neo"), undefined);

console.log("runtimeRegistry ok");
