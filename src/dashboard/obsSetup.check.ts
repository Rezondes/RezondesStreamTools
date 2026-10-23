// Check for obsSetup.ts: split into scenes, drag link, scene collection, websocket requests and
// authentication according to obs-websocket 5. Runs with npm test.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { dragUrl, fxZones, obsAuth, obsLayout, obsRequests, sceneCollection } from "./obsSetup.ts";
import { SCENE_SIZES } from "../core/theme.ts";
import { TEXTS } from "./texts.de.ts";

// The alert cut out of the stage at 400, 30; all other sources in their default size
const areas = { ...SCENE_SIZES, alerts: { width: 1100, height: 500, offset: { x: 400, y: 30 } } };
const layout = obsLayout("https://overlays.example/s/neo", "neo", "k1", { scenes: TEXTS.scenes, overlayScene: "Overlays" }, areas);

// Three full-screen scenes with one source each, plus one scene with the other six overlays
assert.deepEqual(layout.map(scene => scene.name), [TEXTS.scenes.starting, TEXTS.scenes.brb, TEXTS.scenes.ending, "Overlays"]);
assert.deepEqual(layout[3].sources.map(source => source.name), ["neo alerts", "neo chat", "neo cam", "neo music", "neo stats", "neo fx", "neo minimes"]);
const chat = layout[3].sources[1];
assert.deepEqual(chat, { scene: "chat", name: "neo chat", url: "https://overlays.example/s/neo/chat?key=k1", width: 500, height: 900, x: 0, y: 0 });
const alerts = layout[3].sources[0];
assert.deepEqual([alerts.width, alerts.height, alerts.x, alerts.y], [1100, 500, 400, 30], "the alert keeps its place on the canvas");

// Dragging: name and size as layer parameters
assert.equal(dragUrl(chat), "https://overlays.example/s/neo/chat?key=k1&layer-name=neo+chat&layer-width=500&layer-height=900");

// Scene collection: scene items refer to the browser sources by name and uuid
let counter = 0;
const collection = sceneCollection("Overlays neo", layout, () => `id-${++counter}`);
assert.equal(collection.current_scene, TEXTS.scenes.starting);
assert.equal(collection.sources.length, 10 + 4);
const input = collection.sources.find(source => source.name === "neo chat")!;
assert.deepEqual(input.settings, { url: chat.url, width: 500, height: 900, reroute_audio: true });
// Starting, BRB, Ending reload when the scene is activated (timer from the start), the others keep running
const brb = collection.sources.find(source => source.name === "neo brb")!;
assert.deepEqual(brb.settings, { url: "https://overlays.example/s/neo/brb?key=k1", width: 1920, height: 1080, reroute_audio: true, restart_when_active: true, shutdown: true });
const overlays = collection.sources.find(source => source.name === "Overlays") as { settings: { items: { name: string; source_uuid?: string }[] } };
assert.deepEqual(overlays.settings.items.find(item => item.name === "neo chat")?.source_uuid, input.uuid);
const items = (overlays as unknown as { settings: { items: { name: string; pos: { x: number; y: number } }[] } }).settings.items;
assert.deepEqual(items.find(item => item.name === "neo alerts")?.pos, { x: 400, y: 30 }, "the file puts the alert where it was drawn");

// websocket: create missing scenes and sources, only update existing sources
const requests = obsRequests(layout, ["Overlays"], ["neo chat"]);
assert.deepEqual(requests.filter(request => request.requestType === "CreateScene").map(request => request.requestData.sceneName), [TEXTS.scenes.starting, TEXTS.scenes.brb, TEXTS.scenes.ending]);
assert.deepEqual(requests.filter(request => request.requestType === "SetInputSettings").map(request => request.requestData.inputName), ["neo chat"]);
assert.equal(requests.filter(request => request.requestType === "CreateInput").length, 9);
// Only the alert says where its item belongs
assert.deepEqual(requests.filter(request => request.place).map(request => [request.requestData.inputName, request.place]), [["neo alerts", { sceneName: "Overlays", x: 400, y: 30 }]]);

// Authentication as described in the protocol
const sha = (text: string) => createHash("sha256").update(text).digest("base64");
assert.equal(await obsAuth("geheim", "salt", "challenge"), sha(sha("geheimsalt") + "challenge"));

// Further effect zones: each once, without main and empty ones; an effects source of their own in the overlay scene
const triggers = [{ do: [{ zone: "top" }, {}, { zone: "main" }] }, { do: [{ zone: "" }, { zone: "links unten" }, { zone: "top" }] }];
assert.deepEqual(fxZones(triggers), ["links unten", "top"]);
const zoned = obsLayout("https://overlays.example/s/neo", "neo", "k1", { scenes: TEXTS.scenes, overlayScene: "Overlays" }, areas, fxZones(triggers));
const top = zoned[3].sources.find(source => source.zone === "top");
assert.deepEqual(top, { scene: "fx", name: "neo fx top", url: "https://overlays.example/s/neo/fx?key=k1&zone=top", width: 1920, height: 1080, x: 0, y: 0, zone: "top" });
assert.equal(zoned[3].sources.find(source => source.zone === "links unten")?.url, "https://overlays.example/s/neo/fx?key=k1&zone=links%20unten");
assert.equal(obsRequests(zoned, [], []).filter(request => request.requestData.inputName === "neo fx top").length, 1, "the websocket import creates it too");

console.log("obsSetup ok");
