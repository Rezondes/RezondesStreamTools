// Check für runtimeRegistry.ts: eine Laufzeit pro Login, überholte oder inzwischen gesperrte Starts werden
// verworfen und gestoppt. Läuft mit npm test.
import assert from "node:assert/strict";
import { runtimeRegistry } from "./runtimeRegistry.ts";

type Fake = { id: number; stopped: boolean; stop: () => void };
let nextId = 1;
const fake = (): Fake => {
  const runtime: Fake = { id: nextId++, stopped: false, stop: () => { runtime.stopped = true; } };
  return runtime;
};
// Start, dessen Aufbau erst auf release() fertig wird (wie Dateien lesen und Verbindungen öffnen)
function held() {
  let release: () => void = () => {};
  const runtime = fake();
  const create = () => new Promise<Fake>(resolve => { release = () => resolve(runtime); });
  return { runtime, create, release: () => release() };
}

const registry = runtimeRegistry<Fake>();
let allowed = true;

// Normaler Start, Neustart stoppt die alte Laufzeit
const first = await registry.start("neo", () => Promise.resolve(fake()), () => allowed);
assert.ok(first);
const second = await registry.start("neo", () => Promise.resolve(fake()), () => allowed);
assert.equal(first.stopped, true);
assert.equal(registry.get("neo"), second);
assert.deepEqual(registry.logins(), ["neo"]);

// Zwei Starts gleichzeitig (zwei Anmeldungen): nur der neuere bleibt, der ältere wird gestoppt, nie zwei
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

// Gesperrt, während der Start läuft (Admin speichert Zugänge): die neue Laufzeit wird gestoppt, keine verwaltet
const revoked = held();
const startRevoked = registry.start("morpheus", revoked.create, () => allowed);
allowed = false;
registry.stop("morpheus");
revoked.release();
assert.equal(await startRevoked, null);
assert.equal(revoked.runtime.stopped, true);
assert.equal(registry.get("morpheus"), undefined);
allowed = true;

// Nur der Zugang wird entzogen (der Start steht noch nicht in der Liste, die Sperre sieht ihn nicht): verworfen
const unlisted = held();
const startUnlisted = registry.start("niobe", unlisted.create, () => allowed);
allowed = false;
unlisted.release();
assert.equal(await startUnlisted, null);
assert.equal(unlisted.runtime.stopped, true);
allowed = true;

// stopAll erwischt auch laufende Starts
const pending = held();
const startPending = registry.start("oracle", pending.create, () => allowed);
registry.stopAll();
pending.release();
assert.equal(await startPending, null);
assert.equal(pending.runtime.stopped, true);
assert.equal(registry.count(), 0);

// Nichts zu starten (keine Tokens); eine beendete Laufzeit trägt sich nur aus, wenn sie noch aktuell ist
assert.equal(await registry.start("neo", () => Promise.resolve(null), () => allowed), null);
const current = await registry.start("neo", () => Promise.resolve(fake()), () => allowed);
assert.ok(current);
registry.ended("neo", fake());
assert.equal(registry.get("neo"), current);
registry.ended("neo", current);
assert.equal(registry.get("neo"), undefined);

console.log("runtimeRegistry ok");
