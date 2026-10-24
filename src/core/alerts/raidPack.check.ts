// Check of raidPack.ts (plans/PLAN-ALERTDAUER.md package 2): one run per raider up to maxDogs, never more than
// maxOnScreen at once, every run shorter than crossMs and done by endMs, deterministic, runnersAt only looks at the
// window of running entries. Run: node src/core/alerts/raidPack.check.ts
import assert from "node:assert/strict";
import { raidPack, runnersAt, type RaidPackOptions } from "./raidPack.ts";

const options: RaidPackOptions = { raiders: 42, maxDogs: 300, maxOnScreen: 12, crossMs: 2400, speedSpread: 0.2, lanes: 4, seed: 1 };
const running = (pack: ReturnType<typeof raidPack>, elapsedMs: number) => pack.runners.filter(runner => runner.startMs < elapsedMs && elapsedMs < runner.startMs + runner.durationMs);

// Anzahl: as many runs as raiders, at most maxDogs; none for no raiders
assert.equal(raidPack({ ...options, raiders: 3 }).runners.length, 3);
assert.equal(raidPack({ ...options, raiders: 1000 }).runners.length, 300);
assert.deepEqual(raidPack({ ...options, raiders: 0 }), { runners: [], gapMs: 200, endMs: 0 });
assert.equal(raidPack({ ...options, raiders: -4 }).runners.length, 0);

// Grenze gleichzeitig: the table of the prototype (limit 12) and the limits 1 and 20, sampled every 2 ms
for (const [raiders, maxOnScreen] of [[5, 12], [15, 12], [50, 12], [100, 12], [500, 12], [1000, 12], [30, 1], [200, 20]]) {
  const pack = raidPack({ ...options, raiders, maxDogs: 1000, maxOnScreen });
  assert.equal(pack.runners.length, raiders);
  let most = 0;
  for (let elapsed = 0; elapsed <= pack.endMs; elapsed += 2) most = Math.max(most, running(pack, elapsed).length);
  assert.ok(most <= maxOnScreen, `${raiders} raiders, limit ${maxOnScreen}: ${most} at once`);
}
// The alert lengths of the prototype follow from the end of the pack (1.7 s in, the dog waits 0.3 s, at least 5.6 s)
const alertSeconds = (raiders: number) => 8.2 + Math.max(0, 1.7 + raidPack({ ...options, raiders, maxDogs: 1000 }).endMs / 1000 + 0.3 - 5.6);
assert.deepEqual([5, 15, 50, 100, 500, 1000].map(raiders => Math.round(alertSeconds(raiders) * 10) / 10), [8.2, 9.8, 16.8, 26.8, 106.8, 206.8]);

// Läufe: every run shorter than crossMs, done by endMs, starts strictly rising, lanes and pick in range
const pack = raidPack({ ...options, raiders: 100 });
assert.equal(pack.endMs, 99 * 200 + 2400);
pack.runners.forEach((runner, index) => {
  assert.equal(runner.index, index);
  assert.ok(runner.durationMs < options.crossMs && runner.durationMs >= options.crossMs * 0.8, `run ${index}`);
  assert.ok(runner.startMs + runner.durationMs <= pack.endMs);
  if (index > 0) assert.ok(runner.startMs > pack.runners[index - 1].startMs);
  assert.ok(Number.isInteger(runner.lane) && runner.lane >= 0 && runner.lane < 4);
  assert.ok(runner.pick >= 0 && runner.pick < 1);
});
assert.ok(new Set(pack.runners.map(runner => runner.lane)).size === 4, "every lane is used");
const steady = raidPack({ ...options, speedSpread: 0 });
assert.ok(steady.runners.every(runner => runner.durationMs === options.crossMs), "no spread: every run takes crossMs");

// Deterministisch: the same options give the same list; another seed changes lanes, tempi and looks, not the starts
assert.deepEqual(raidPack(options), raidPack(options));
const other = raidPack({ ...options, seed: 2 });
assert.deepEqual(other.runners.map(runner => runner.startMs), raidPack(options).runners.map(runner => runner.startMs));
assert.notDeepEqual(other.runners.map(runner => [runner.lane, runner.durationMs, runner.pick]), raidPack(options).runners.map(runner => [runner.lane, runner.durationMs, runner.pick]));

// Laufende: exactly the running entries with their progress, looking at no more than maxOnScreen + 2 of them
for (const elapsed of [0, 1, 199, 200, 201, 2399, 2400, 5000, 21_900, pack.endMs, pack.endMs + 1]) {
  const now = runnersAt(pack, elapsed);
  assert.deepEqual(now.map(entry => entry.runner), running(pack, elapsed), `at ${elapsed}`);
  assert.ok(now.every(entry => entry.progress > 0 && entry.progress < 1));
}
for (const runner of pack.runners.slice(0, 20)) {
  assert.ok(!runnersAt(pack, runner.startMs).some(entry => entry.runner === runner), "not yet at its start");
  assert.ok(!runnersAt(pack, runner.startMs + runner.durationMs).some(entry => entry.runner === runner), "gone at its end");
  const middle = runnersAt(pack, runner.startMs + runner.durationMs / 2).find(entry => entry.runner === runner);
  assert.ok(middle && Math.abs(middle.progress - 0.5) < 1e-9);
}
let looked = 0;
const counted = {
  ...pack,
  runners: new Proxy(pack.runners, {
    get: (list, key, receiver): unknown => {
      if (typeof key === "string" && /^\d+$/.test(key)) looked++;
      return Reflect.get(list, key, receiver) as unknown;
    },
  }),
};
for (const elapsed of [500, 5000, 15_000]) {
  looked = 0;
  runnersAt(counted, elapsed);
  assert.ok(looked <= options.maxOnScreen + 2, `looked at ${looked}`);
}
assert.deepEqual(runnersAt(raidPack({ ...options, raiders: 0 }), 100), []);

console.log("raidPack ok");
