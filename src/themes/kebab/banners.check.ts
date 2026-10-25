// Check for banners.ts: profile and offline banner are still pictures (the same at every time), the texts are drawn and
// the steam can be switched off. Runs with npm test.
import assert from "node:assert/strict";
import { effectiveSettings } from "../../core/settings.ts";
import { type BannerLook, makeOffline, makeProfile } from "./banners.ts";
import { steamLookOf } from "./food.ts";
import { kebabBannerLayout } from "./render.ts";
import { type KebabValues, kebabSettings } from "./settings.ts";
import { INK, recorder } from "./stinger.check.ts";

const defaults = effectiveSettings(kebabSettings, {}) as unknown as KebabValues;

const look = (own: Partial<BannerLook> = {}): BannerLook => ({
  width: 1200, height: 480, steam: true, ink: INK, titleFont: "Titan One", font: "Nunito",
  colors: { red: "#f85449", redText: "#c8261b", paper: "#fff8ec", brown: "#3a1a12", muted: "#8a5a4a", steam: "#fff8ec" },
  arc: { text: "DÖNER KEBAB", size: 72, span: 66, stroke: 4 }, hatchRows: 32, steamHeight: 70,
  steamLook: steamLookOf(defaults), layout: kebabBannerLayout(defaults), ...own,
});
const profile = (own: Partial<BannerLook> = {}) => {
  const canvas = recorder();
  makeProfile(look(own), { title: "Rezondes' Döner", line: "Frisch vom Spieß" })(canvas.context);
  return canvas.calls;
};
const offline = (own: Partial<BannerLook> = {}) => {
  const canvas = recorder();
  makeOffline(look({ width: 1920, height: 1080, ...own }), "Heute geschlossen")(canvas.context);
  return canvas.calls;
};

// A still: the same picture every time
for (const draw of [profile, offline]) assert.deepEqual(draw(), draw());
assert.ok(profile().includes("fillText(Rezondes' Döner,600.000,412.800)"));
assert.ok(profile().includes("fillText(Frisch vom Spieß,600.000,456.000)"));
assert.ok(offline().some(call => call.startsWith("fillText(Heute geschlossen,")));
// Steam: three wisps with their alpha, none when it is off
const wisps = (calls: string[]) => calls.filter(call => call.startsWith("globalAlpha")).length;
assert.equal(wisps(profile()), 3);
assert.equal(wisps(profile({ steam: false })), 0);
assert.ok(wisps(offline()) > wisps(offline({ steam: false })));

console.log("kebab banners ok");
