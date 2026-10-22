// Check for panels.ts: boxes and hit test of layers (the top one wins, texts by their lines), drawing order and
// file names. A recording mock canvas stands in for the browser. Runs with npm test.
import assert from "node:assert/strict";
import { drawPanel, layerAt, layerBox, type Panel, panelFileName } from "./panels.ts";

const placed = { opacity: 1, rotate: 0 };
const panel: Panel = {
  id: "p", name: "Über mich", height: 100, background: "#000000",
  layers: [
    { ...placed, id: "r", kind: "rect", x: 0, y: 0, w: 320, h: 100, fill: "#111111", fill2: "#222222", radius: 12, stroke: "#ffffff", strokeWidth: 2 },
    { ...placed, id: "t", kind: "text", x: 20, y: 30, w: 280, text: "ÜBER\nMICH", font: "Inter", size: 20, weight: 700, color: "#ffffff", align: "center", stroke: "#000000", strokeWidth: 0, glow: 4, glowColor: "#ff00ff" },
    { ...placed, id: "i", kind: "image", x: 250, y: 10, w: 40, h: 40, src: "data:x" },
  ],
};

assert.deepEqual(layerBox(panel.layers[1]), { x: 20, y: 30, w: 280, h: 48 });
assert.equal(layerAt(panel, 260, 20), 2);
assert.equal(layerAt(panel, 100, 60), 1);
assert.equal(layerAt(panel, 5, 95), 0);
assert.equal(layerAt(panel, 400, 20), -1);
// Hidden and locked layers are not picked, a hidden one is not drawn
assert.equal(layerAt({ ...panel, layers: panel.layers.map(layer => (layer.id === "i" ? { ...layer, locked: true } : layer)) }, 260, 20), 0);
assert.equal(layerAt({ ...panel, layers: panel.layers.map(layer => (layer.id === "t" ? { ...layer, hidden: true } : layer)) }, 100, 60), 0);

const calls: string[] = [];
const context = new Proxy({}, {
  get: (_, key: string) => (key === "createLinearGradient" ? () => ({ addColorStop: () => {} }) : (...args: unknown[]) => { calls.push(`${key}${key === "fillText" || key === "drawImage" ? ` ${String(args[0] === "data:x" ? "image" : args[0])}` : ""}`); }),
  set: () => true,
}) as unknown as CanvasRenderingContext2D;
drawPanel(context, panel, new Map([["data:x", "image" as unknown as CanvasImageSource]]));
assert.deepEqual(calls.filter(call => call.startsWith("fillText") || call.startsWith("drawImage") || call === "stroke"), ["stroke", "fillText ÜBER", "fillText MICH", "drawImage image"]);
calls.length = 0;
drawPanel(context, panel, new Map());
assert.ok(!calls.some(call => call.startsWith("drawImage")), "a picture not loaded yet is left out");
calls.length = 0;
drawPanel(context, { ...panel, layers: panel.layers.map(layer => ({ ...layer, hidden: layer.kind === "text" })) }, new Map());
assert.ok(!calls.some(call => call.startsWith("fillText")), "a hidden layer is left out");

assert.equal(panelFileName("Über mich", 0, "png"), "panel-1-ueber-mich.png");
assert.equal(panelFileName("Regeln & Infos!", 2, "jpg"), "panel-3-regeln-infos.jpg");
assert.equal(panelFileName("???", 4, "png"), "panel-5.png");

console.log("panels ok");
