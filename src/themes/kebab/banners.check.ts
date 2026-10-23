// Check for banners.ts: profile and offline banner close their loop without a seam (the picture at 0 equals the one at
// the end of the loop), the spit and the steam move in between, speeds snap to whole turns, and the texts are drawn.
// Runs with npm test.
import assert from "node:assert/strict";
import { type BannerLook, loopSpeed, makeOffline, makeProfile } from "./banners.ts";
import { INK, recorder } from "./stinger.check.ts";

const look = (own: Partial<BannerLook> = {}): BannerLook => ({
  width: 1200, height: 480, loop: 4, steam: true, ink: INK, titleFont: "Titan One", font: "Nunito",
  colors: { red: "#f85449", redText: "#c8261b", paper: "#fff8ec", brown: "#3a1a12", muted: "#8a5a4a", steam: "#fff8ec" },
  arc: { text: "DÖNER KEBAB", size: 72, span: 66, stroke: 4 }, spitSpeed: 18, hatchRows: 32, steamHeight: 70, ...own,
});
const profile = (time: number, own: Partial<BannerLook> = {}) => {
  const canvas = recorder();
  makeProfile(look(own), { title: "Rezondes' Döner", line: "Frisch vom Spieß" })(canvas.context, time);
  return canvas.calls;
};
const offline = (time: number, own: Partial<BannerLook> = {}) => {
  const canvas = recorder();
  makeOffline(look({ width: 1920, height: 1080, ...own }), "Heute geschlossen")(canvas.context, time);
  return canvas.calls;
};

// Schleife: the same picture at the start and at the end of the loop, another one in between
for (const draw of [profile, offline]) {
  assert.deepEqual(draw(0), draw(4));
  assert.notDeepEqual(draw(0), draw(1.3));
  assert.deepEqual(draw(0, { loop: 2.5 }), draw(2.5, { loop: 2.5 }));
}
assert.ok(profile(0).includes("fillText(Rezondes' Döner,600.000,412.800)"));
assert.ok(profile(0).includes("fillText(Frisch vom Spieß,600.000,456.000)"));
assert.ok(offline(0).some(call => call.startsWith("fillText(Heute geschlossen,")));
// Without steam no wisps (no strokes with an alpha), the spit still turns
assert.ok(!profile(1, { steam: false }).some(call => call.startsWith("globalAlpha")));
assert.notDeepEqual(profile(0, { steam: false }), profile(1, { steam: false }));

// Whole turns per loop, at least one when it moves, none when it stands
assert.equal(loopSpeed(18, 42, 4), 21);
assert.equal(loopSpeed(1, 42, 4), 10.5);
assert.equal(loopSpeed(0, 42, 4), 0);

console.log("kebab banners ok");
