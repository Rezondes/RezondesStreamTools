// Check for sun.ts: the sunrise follows the time from below the horizon to the set height, without it the sun stands at
// the set height; the direction points up as far as the height says. Runs with npm test.
import assert from "node:assert/strict";
import { exposureFactor, sceneSunHeight, skyLight, sunDirection, sunHeight, sunLight, SUNRISE_FROM, SUNSET_TO } from "./sun.ts";

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

// Mittag und Untergang: the BRB and the commands page stand at the noon height, the Ending sets below the horizon
const scene = { ...rise, noon: 55, sunsetSeconds: 5 };
near(sceneSunHeight("brb", 3, scene), 55, "noon");
near(sceneSunHeight("info", 0, scene), 55, "info");
near(sceneSunHeight("ending", 0, scene), 4.5, "sunset start");
assert.ok(sceneSunHeight("ending", 2, scene) < 4.5);
near(sceneSunHeight("ending", 5, scene), SUNSET_TO, "set");
assert.ok(SUNSET_TO < 0);
near(sceneSunHeight("starting", 4, scene), 4.5, "starting rises");

console.log("urlaub scene sun ok");

// The exposure follows the sun: unchanged for the low sun, lower at noon, higher in the dusk, within bounds
near(exposureFactor(4.5), 1, "low sun");
assert.ok(exposureFactor(55) < 0.4 && exposureFactor(55) > 0.2);
assert.ok(exposureFactor(-2) > 1 && exposureFactor(-40) <= 3);
