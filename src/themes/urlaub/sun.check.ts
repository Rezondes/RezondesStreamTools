// Check for sun.ts: the sunrise follows the time from below the horizon to the set height, without it the sun stands at
// the set height; the direction points up as far as the height says. Runs with npm test.
import assert from "node:assert/strict";
import { skyLight, sunDirection, sunHeight, sunLight, SUNRISE_FROM } from "./sun.ts";

const near = (actual: number, expected: number, label: string) => assert.ok(Math.abs(actual - expected) < 1e-9, `${label}: ${actual}`);

// Sonnenaufgang: below the horizon at the start, rising, at the height after the sunrise and beyond it
const rise = { sunriseOn: true, sunriseSeconds: 4, height: 4.5 };
near(sunHeight(0, rise), SUNRISE_FROM, "start");
assert.ok(sunHeight(1, rise) < sunHeight(2, rise) && sunHeight(2, rise) < sunHeight(3, rise));
near(sunHeight(4, rise), 4.5, "risen");
near(sunHeight(9, rise), 4.5, "stays");
// Without the sunrise the sun stands at the height from the start
near(sunHeight(0, { ...rise, sunriseOn: false }), 4.5, "off");

// The direction: level at height 0, straight up at 90, toward the azimuth
near(sunDirection(0, 196)[1], 0, "level");
near(sunDirection(90, 196)[1], 1, "up");
const [x, , depth] = sunDirection(0, 90);
near(x, 1, "east x");
near(depth, 0, "east z");

// Light: none deep below the horizon, full a little above, the sky never dark
assert.equal(sunLight(-5), 0);
assert.equal(sunLight(10), 1);
assert.ok(skyLight(-10) > 0 && skyLight(20) <= 0.95 + 1e-9);

console.log("urlaub sun ok");
