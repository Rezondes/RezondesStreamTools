// Check für obsSetup.ts: Aufteilung in Szenen, Link zum Ziehen, Szenensammlung, websocket-Anfragen und
// Authentifizierung nach obs-websocket 5. Läuft mit npm test.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { dragUrl, obsAuth, obsLayout, obsRequests, sceneCollection } from "./obsSetup.ts";
import { TEXTS } from "./texts.de.ts";

const layout = obsLayout("https://overlays.example/s/neo", "neo", TEXTS.scenes, "Overlays");

// Drei Vollbild-Szenen mit je einer Quelle, dazu eine Szene mit den übrigen fünf Overlays
assert.deepEqual(layout.map(scene => scene.name), [TEXTS.scenes.starting, TEXTS.scenes.brb, TEXTS.scenes.ending, "Overlays"]);
assert.deepEqual(layout[3].sources.map(source => source.name), ["neo alerts", "neo chat", "neo cam", "neo music", "neo fx", "neo minimes"]);
const chat = layout[3].sources[1];
assert.deepEqual(chat, { scene: "chat", name: "neo chat", url: "https://overlays.example/s/neo/chat", width: 500, height: 900 });

// Ziehen: Name und Grösse als layer-Parameter
assert.equal(dragUrl(chat), "https://overlays.example/s/neo/chat?layer-name=neo+chat&layer-width=500&layer-height=900");

// Szenensammlung: Szenenelemente verweisen per Name und uuid auf die Browserquellen
let counter = 0;
const collection = sceneCollection("Overlays neo", layout, () => `id-${++counter}`);
assert.equal(collection.current_scene, TEXTS.scenes.starting);
assert.equal(collection.sources.length, 9 + 4);
const input = collection.sources.find(source => source.name === "neo chat")!;
assert.deepEqual(input.settings, { url: chat.url, width: 500, height: 900, reroute_audio: true });
// Starting, BRB, Ending laden beim Aktivieren der Szene neu (Timer von vorn), die anderen laufen durch
const brb = collection.sources.find(source => source.name === "neo brb")!;
assert.deepEqual(brb.settings, { url: "https://overlays.example/s/neo/brb", width: 1920, height: 1080, reroute_audio: true, restart_when_active: true, shutdown: true });
const overlays = collection.sources.find(source => source.name === "Overlays") as { settings: { items: { name: string; source_uuid?: string }[] } };
assert.deepEqual(overlays.settings.items.find(item => item.name === "neo chat")?.source_uuid, input.uuid);

// websocket: fehlende Szenen und Quellen anlegen, vorhandene Quellen nur aktualisieren
const requests = obsRequests(layout, ["Overlays"], ["neo chat"]);
assert.deepEqual(requests.filter(request => request.requestType === "CreateScene").map(request => request.requestData.sceneName), [TEXTS.scenes.starting, TEXTS.scenes.brb, TEXTS.scenes.ending]);
assert.deepEqual(requests.filter(request => request.requestType === "SetInputSettings").map(request => request.requestData.inputName), ["neo chat"]);
assert.equal(requests.filter(request => request.requestType === "CreateInput").length, 8);

// Authentifizierung wie im Protokoll beschrieben
const sha = (text: string) => createHash("sha256").update(text).digest("base64");
assert.equal(await obsAuth("geheim", "salt", "challenge"), sha(sha("geheimsalt") + "challenge"));

console.log("obsSetup ok");
