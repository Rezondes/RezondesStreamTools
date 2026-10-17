// Check for minimeBehavior.ts: which action a minime does next, where it walks, appearing,
// disappearing and reaction to chat. Runs with npm test (alone: node src/core/minimeBehavior.check.ts).
import assert from "node:assert/strict";
import { actorRun, actorStyle, advance, nextAction, nextEnd, positionAt, react, shownVariant, syncRoster, type MinimeActor, type MinimeStage } from "./minimeBehavior.ts";
import { readMinimeOptions } from "./minimeFields.ts";

const MOTION = readMinimeOptions({}).motion;
const STAGE: MinimeStage = { motion: MOTION, catalog: [{ name: "backflip", durationMs: 1500, weight: 0 }, { name: "glitch", durationMs: 800, weight: 20 }], widthPx: 1920 };
// Randomness as a fixed sequence that repeats
const sequence = (...values: number[]) => { let index = 0; return () => values[index++ % values.length]; };
const actor = (changes: Partial<MinimeActor> = {}): MinimeActor => ({
  login: "neo", user: "Neo", color: "#ff00aa", variant: null, action: "idle", startedAt: 0, durationMs: 1000, fromX: 1000, toX: 1000, facing: 1, leaving: false, ...changes,
});

// Weights: idle 40, walk 40, glitch 20, backflip 0 never comes
assert.equal(nextAction(actor(), STAGE, 5000, sequence(0.1, 0)).action, "idle");
assert.equal(nextAction(actor(), STAGE, 5000, sequence(0.5, 0, 0)).action, "walk");
assert.equal(nextAction(actor(), STAGE, 5000, sequence(0.9)).action, "glitch");
assert.equal(nextAction(actor(), STAGE, 5000, sequence(0.999)).action, "glitch");
// All weights 0: float
const still: MinimeStage = { ...STAGE, motion: { ...MOTION, idleWeight: 0, walkWeight: 0 }, catalog: [] };
assert.equal(nextAction(actor(), still, 5000, sequence(0.5, 0)).action, "idle");
// Theme's own action: duration from the catalog, stays in place
assert.deepEqual(nextAction(actor({ fromX: 900, toX: 1000, action: "walk" }), STAGE, 5000, sequence(0.9)), actor({ action: "glitch", startedAt: 5000, durationMs: 800, fromX: 1000, toX: 1000 }));

// Floating: duration between idleMinMs and idleMaxMs
assert.equal(nextAction(actor(), STAGE, 0, sequence(0.1, 0)).durationMs, 2000);
assert.equal(nextAction(actor(), STAGE, 0, sequence(0.1, 0.5)).durationMs, 4000);

// Walking: distance between walkMin and walkMax, random direction, duration = distance / speed
{
  const left = nextAction(actor(), STAGE, 0, sequence(0.5, 0, 0.2));
  assert.deepEqual({ fromX: left.fromX, toX: left.toX, facing: left.facing, durationMs: Math.round(left.durationMs) }, { fromX: 1000, toX: 900, facing: -1, durationMs: 1667 });
  const right = nextAction(actor(), STAGE, 0, sequence(0.5, 1, 0.8));
  assert.deepEqual({ toX: right.toX, facing: right.facing }, { toX: 1600, facing: 1 });
  // At the edge: the direction turns; if the distance fits nowhere, it ends at the edge (never outside margin)
  const edge = nextAction(actor({ fromX: 100, toX: 100 }), STAGE, 0, sequence(0.5, 1, 0.2));
  assert.deepEqual({ toX: edge.toX, facing: edge.facing }, { toX: 700, facing: 1 });
  const narrow = nextAction(actor({ fromX: 300, toX: 300 }), { ...STAGE, widthPx: 600 }, 0, sequence(0.5, 1, 0.8));
  assert.deepEqual({ toX: narrow.toX, facing: narrow.facing }, { toX: 540, facing: 1 });
}

// Position: proportional during walk, otherwise at the target
assert.equal(positionAt(actor({ action: "walk", startedAt: 0, durationMs: 1000, fromX: 0, toX: 100 }), 500), 50);
assert.equal(positionAt(actor({ action: "walk", startedAt: 0, durationMs: 1000, fromX: 0, toX: 100 }), 5000), 100);
assert.equal(positionAt(actor({ action: "walk", startedAt: 0, durationMs: 0, fromX: 0, toX: 100 }), 0), 100);

// Sync the list: new ones appear at a random place, missing ones disappear, known ones take over name and color
{
  const joined = syncRoster([], [{ login: "neo", user: "Neo", color: null, variant: null }], STAGE, 100, sequence(0.5));
  assert.deepEqual(joined, [actor({ color: null, action: "enter", startedAt: 100, durationMs: 1200, fromX: 960, toX: 960 })]);
  const recolored = syncRoster(joined, [{ login: "neo", user: "NEO", color: "#00ff00", variant: null }], STAGE, 200, sequence(0.5));
  assert.deepEqual({ user: recolored[0].user, color: recolored[0].color, action: recolored[0].action }, { user: "NEO", color: "#00ff00", action: "enter" });
  const walking = [actor({ action: "walk", startedAt: 0, durationMs: 1000, fromX: 0, toX: 100 })];
  const leaving = syncRoster(walking, [], STAGE, 500, sequence(0.5));
  assert.deepEqual(leaving, [actor({ action: "exit", startedAt: 500, durationMs: 900, fromX: 50, toX: 50, leaving: true })]);
  // Back before it is gone: appears again at the same place
  const back = syncRoster(leaving, [{ login: "neo", user: "Neo", color: "#ff00aa", variant: null }], STAGE, 600, sequence(0.5));
  assert.deepEqual(back, [actor({ action: "enter", startedAt: 600, durationMs: 1200, fromX: 50, toX: 50 })]);
}

// Advance: expired ones get the next action, vanished ones drop out; nextEnd = next end
{
  const running = [actor({ login: "a", startedAt: 0, durationMs: 1000 }), actor({ login: "b", startedAt: 0, durationMs: 3000 }), actor({ login: "c", action: "exit", leaving: true, startedAt: 0, durationMs: 900 })];
  const result = advance(running, STAGE, 1000, sequence(0.9));
  assert.deepEqual(result.map(entry => [entry.login, entry.action]), [["a", "glitch"], ["b", "idle"]]);
  assert.equal(nextEnd(result), 1800);
  assert.equal(advance(running, STAGE, 500, sequence(0.9)), running);
  assert.equal(nextEnd([]), null);
}

// Reaction: interrupts floating, walking (at the current place) and theme actions, never appearing or disappearing
{
  const boost = { name: "boost", durationMs: 700, weight: 0 };
  assert.deepEqual(react(actor(), boost, 300), actor({ action: "boost", startedAt: 300, durationMs: 700 }));
  assert.deepEqual(react(actor({ action: "walk", startedAt: 0, durationMs: 1000, fromX: 0, toX: 100 }), boost, 500), actor({ action: "boost", startedAt: 500, durationMs: 700, fromX: 50, toX: 50 }));
  const entering = actor({ action: "enter" });
  assert.equal(react(entering, boost, 300), entering);
  const leaving = actor({ action: "exit", leaving: true });
  assert.equal(react(leaving, boost, 300), leaving);
}

// Rendering for all themes: position, duration of the movement (only when walking), duration of the action and facing as
// CSS variables; a new key per action restarts its animation
assert.deepEqual(actorStyle(actor({ action: "walk", toX: 120, durationMs: 800, facing: -1 })), { "--x": "120px", "--move": "800ms", "--action-ms": "800ms", "--facing": -1 });
assert.equal(actorStyle(actor({ action: "idle" }))["--move"], "0ms");
assert.equal(actorRun(actor({ action: "spin", startedAt: 42 })), "spin-42");

// Variant of the figure: the one from the server, otherwise in the demo an allowed one by login (always the same), otherwise the default
assert.equal(shownVariant(actor({ variant: "mango" }), ["kiwi"], "zitrone", true), "mango");
assert.equal(shownVariant(actor(), ["kiwi"], "zitrone", true), "kiwi");
assert.equal(shownVariant(actor(), ["kiwi"], "zitrone", false), "zitrone");
assert.equal(shownVariant(actor(), [], "zitrone", true), "zitrone");

console.log("minimeBehavior ok");
