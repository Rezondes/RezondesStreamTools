// Check of sceneArea.ts: areas from the theme or the default size, alerts cut out of the stage
import assert from "node:assert/strict";
import { alertArea, areaOf, areasOf, sceneFrame, setSceneFrame } from "./sceneArea.ts";
import { SCENE_SIZES, type ThemeModule } from "./theme.ts";

const module = { areas: () => ({ chat: { width: 400, height: 700 } }) } as unknown as ThemeModule;
assert.deepEqual(areaOf(module, {}, "chat"), { width: 400, height: 700 }, "the theme decides");
assert.deepEqual(areaOf(module, {}, "music"), SCENE_SIZES.music, "a scene it leaves out gets the default");
assert.deepEqual(areaOf(null, {}, "alerts"), SCENE_SIZES.alerts, "no theme");
assert.deepEqual(areasOf(module, {}), { ...SCENE_SIZES, chat: { width: 400, height: 700 } }, "all scenes at once");

// Centered card of 600 x 200 at 100 with 50 room: the card and the room around it
assert.deepEqual(alertArea({ top: 100, width: 600, height: 200, room: 50 }), { width: 700, height: 300, offset: { x: 610, y: 50 } });
// Scaled from the top edge
assert.deepEqual(alertArea({ top: 100, width: 600, height: 200, scale: 0.5, room: 0 }), { width: 300, height: 100, offset: { x: 810, y: 100 } });
// Left and right keep the side distance
assert.equal(alertArea({ align: "left", top: 0, width: 100, height: 100, room: 0 }).offset?.x, 48);
assert.equal(alertArea({ align: "right", top: 0, width: 100, height: 100, room: 0 }).offset?.x, 1920 - 48 - 100);
// From the top corner of a left alignment, or from the middle with centerOrigin
assert.equal(alertArea({ align: "left", top: 0, width: 100, height: 100, scale: 0.5, room: 0 }).offset?.x, 48);
assert.equal(alertArea({ align: "left", top: 0, width: 100, height: 100, scale: 0.5, room: 0, centerOrigin: true }).offset?.x, 73);
assert.equal(alertArea({ align: "right", top: 0, width: 100, height: 100, scale: 0.5, room: 0 }).offset?.x, 1920 - 48 - 50);
// Room per side
assert.deepEqual(alertArea({ top: 100, width: 600, height: 200, room: { left: 10, right: 20, top: 30, bottom: 40 } }), { width: 630, height: 270, offset: { x: 650, y: 70 } });
// Room beyond the stage is cut off
assert.deepEqual(alertArea({ top: 20, width: 1900, height: 1060, room: 300 }), { width: 1920, height: 1080, offset: { x: 0, y: 0 } });

// Frame: the window until the page sets the stage
globalThis.innerWidth = 640;
globalThis.innerHeight = 360;
assert.deepEqual(sceneFrame(), { width: 640, height: 360 });
setSceneFrame({ width: 1920, height: 1080 });
assert.deepEqual(sceneFrame(), { width: 1920, height: 1080 });
setSceneFrame(null);

console.log("sceneArea ok");
