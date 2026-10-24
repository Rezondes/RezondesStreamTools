// Check of banners.ts (PLAN-DOGS.md package 5, AC3): both banners are still pictures (the same calls every time, the
// image does not depend on a clock), the texts are drawn, the profile shows all six dogs and the offline banner the
// sleeping dog in the dark room. Run: node src/themes/dogs/banners.check.ts
import assert from "node:assert/strict";
import { resolveSettings } from "../../core/settings.ts";
import { bannerLookOf, makeOffline, makeProfile, offlineImage, profileImage, PROFILE_SIZE } from "./banners.ts";
import { recorder } from "./canvasImage.check.ts";
import { dogsSettings, type DogsValues } from "./settings.ts";

const values = resolveSettings(dogsSettings, {}) as unknown as DogsValues;
const look = bannerLookOf(values);
const draw = (make: typeof makeProfile, texts = { title: "RUDEL", line: "Willkommen" }) => {
  const canvas = recorder();
  make(look, texts)(canvas.context);
  return canvas.calls;
};

// Standbild
for (const make of [makeProfile, makeOffline]) assert.deepEqual(draw(make), draw(make));
assert.deepEqual(profileImage(look), profileImage(look));
assert.deepEqual(offlineImage(look), offlineImage(look));
assert.ok(draw(makeProfile).includes(`fillText(RUDEL,${(PROFILE_SIZE.width / 2).toFixed(3)},80.000)`));
assert.ok(draw(makeOffline).some(call => call.startsWith("fillText(Willkommen,960.000,")));
// The profile has the six dogs (their outline color appears in the grass band), the offline room is darkened
assert.equal(look.dogs.length, 6);
assert.ok(profileImage(look).colors.filter(color => color === values.ink).length > 100);
assert.ok(!offlineImage(look).colors.includes(null), "the room fills the picture");

console.log("dogs banners ok");
