// Check of the voice limit for sound clips (plans/PLAN-TOENE.md package 1). Run: node src/core/clipVoices.check.ts
import assert from "node:assert/strict";
import { admitVoice } from "./clipVoices.ts";

const voices = (...starts: number[]) => starts.map((startedAt, index) => ({ id: index + 1, startedAt }));

// Under the limit a new voice plays and nothing stops
assert.deepEqual(admitVoice(voices(10, 20), 3), { admit: true, stop: [] });
assert.deepEqual(admitVoice([], 1), { admit: true, stop: [] });

// At the limit the oldest voice gives way, whatever the order of the list
assert.deepEqual(admitVoice(voices(30, 10, 20), 3), { admit: true, stop: [2] });

// Above the limit (the limit was lowered) the oldest give way until the new one fits
assert.deepEqual(admitVoice(voices(40, 10, 30, 20), 2), { admit: true, stop: [2, 4, 3] });

// A limit of 0 (or less) plays nothing and stops nothing
assert.deepEqual(admitVoice(voices(10), 0), { admit: false, stop: [] });
assert.deepEqual(admitVoice(voices(10), -2), { admit: false, stop: [] });

console.log("clipVoices ok");
