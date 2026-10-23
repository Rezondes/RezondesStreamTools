// Check for panelEditor.ts: a panel from a template, template applied again, layers moved (also on the grid), resized,
// aligned, copied, reordered (not past the ends), added in the look of the panel and removed, panels copied and
// reordered, height kept between 60 and 600, undo and redo. Runs with npm test.
import assert from "node:assert/strict";
import { rectLayer, textLayer } from "../core/panels.ts";
import { addLayer, alignLayer, alignLayers, duplicateLayers, groupBox, guideSnap, moveGroup, removeLayers, toggleLayer, turnAt, applyTemplate, changeLayer, clampHeight, duplicatePanel, movePanel, panelFrom, record, redo, removeLayer, reorderLayer, resizeLayer, snap, undo } from "./panelEditor.ts";

const design = { height: 100, background: "#000000", layers: [rectLayer("card", 0, 0, 320, 100, "#111111"), textLayer("title", 10, 30, 300, "Regeln", "Sniglet", 30, "#ff0000")] };
const panel = panelFrom("Regeln", design);
assert.equal(panel.name, "Regeln");
assert.equal(panel.layers.length, 2);

assert.deepEqual(reorderLayer(panel, 0, 1).layers.map(layer => layer.id), ["title", "card"]);
assert.equal(reorderLayer(panel, 1, 1), panel);
assert.equal(reorderLayer(panel, 0, -1), panel);

const added = addLayer(panel, "text");
const text = added.layers[2];
assert.ok(text.kind === "text" && text.font === "Sniglet" && text.color === "#ff0000");
assert.equal(addLayer(panel, "rect").layers[2].kind, "rect");
const image = addLayer(panel, "image", "data:image/png;base64,AA").layers[2];
assert.ok(image.kind === "image" && image.src.startsWith("data:"));
assert.deepEqual(removeLayer(added, 0).layers.map(layer => layer.kind), ["text", "text"]);

assert.equal(changeLayer(panel, 0, { opacity: 0.5 }).layers[0].opacity, 0.5);
const changed = applyTemplate({ ...panel, name: "Neu", layers: [] }, design);
assert.deepEqual([changed.name, changed.id, changed.layers.length], ["Neu", panel.id, 2]);

assert.deepEqual([clampHeight(20), clampHeight(250.4), clampHeight(900), clampHeight(Number.NaN)], [60, 250, 600, 60]);

// Grid: snapped sizes, a free grid (0) only rounds, never smaller than a step
assert.deepEqual([snap(13, 10), snap(16, 10), snap(13.4, 0)], [10, 20, 13]);
const sized = resizeLayer(panel, 0, 2, 57, 10).layers[0];
assert.ok(sized.kind === "rect" && sized.w === 10 && sized.h === 60);
const textSized = resizeLayer(panel, 1, 155, 999, 0).layers[1];
assert.ok(textSized.kind === "text" && textSized.w === 155 && textSized.size === 30);

// Align: edges and middle of the panel by the box of the layer
assert.equal(alignLayer(panel, 1, "center").layers[1].x, 10);
assert.equal(alignLayer(panel, 1, "right").layers[1].x, 20);
assert.equal(alignLayer(panel, 1, "middle").layers[1].y, 32);
assert.equal(alignLayer(panel, 1, "bottom").layers[1].y, 64);
assert.equal(alignLayer(panel, 1, "top").layers[1].y, 0);

// A panel copy gets new ids
const twin = duplicatePanel(panel, "Kopie");
assert.ok(twin.id !== panel.id && twin.name === "Kopie" && twin.layers.every((layer, index) => layer.id !== panel.layers[index].id));
const list = [panel, twin];
assert.deepEqual(movePanel(list, 0, 1).map(item => item.name), ["Kopie", "Regeln"]);
assert.deepEqual(movePanel(list, 0, -1).map(item => item.name), ["Regeln", "Kopie"]);

// Undo and redo: record clears the future, undo and redo at the ends do nothing
let history = { past: [] as number[], present: 1, future: [] as number[] };
history = record(record(history, 2), 3);
assert.equal(undo(undo(history)).present, 1);
assert.equal(undo(undo(undo(history))).present, 1);
assert.equal(redo(undo(history)).present, 3);
assert.equal(redo(history), history);
assert.deepEqual(record(undo(history), 9).future, []);

// Several layers: the box around them, moved together (grid and guides), aligned to their box, copied, removed
const three = { ...panel, layers: [rectLayer("a", 10, 10, 40, 20, "#111111"), rectLayer("b", 100, 50, 60, 30, "#222222"), rectLayer("c", 200, 5, 20, 20, "#333333")] };
assert.deepEqual(groupBox(three, [0, 1]), { x: 10, y: 10, w: 150, h: 70 });
const together = moveGroup(three, [0, 1], 13, 7, 10, false).panel;
assert.deepEqual(together.layers.map(layer => [layer.x, layer.y]), [[20, 20], [110, 60], [200, 5]]);
const guided = moveGroup(three, [0], 147, 0, 0, true);
assert.deepEqual([guided.panel.layers[0].x, guided.guides.x], [160, [160]], "the left edge snaps to the right edge of b");
assert.deepEqual(guideSnap({ x: 142, y: 41, w: 38, h: 20 }, three, [0, 1, 2]), { dx: -1, dy: -1, guides: { x: [160], y: [50] } });
assert.deepEqual(guideSnap({ x: 61, y: 61, w: 10, h: 10 }, three, [0, 1, 2]).guides, { x: [], y: [] });
assert.deepEqual(alignLayers(three, [0, 1], "left").layers.map(layer => layer.x), [10, 10, 200]);
assert.deepEqual(alignLayers(three, [2], "left").layers.map(layer => layer.x), [10, 100, 0]);
const copies = duplicateLayers(three, [2, 0]);
assert.deepEqual([copies.copies, copies.panel.layers[3].x, copies.panel.layers[4].x], [[3, 4], 18, 208]);
assert.deepEqual(removeLayers(three, [0, 2]).layers.map(layer => layer.id), ["b"]);

// Hide and lock toggle, the turn follows the pointer around the middle and snaps to steps
assert.equal(toggleLayer(three, 0, "hidden").layers[0].hidden, true);
assert.equal(toggleLayer(toggleLayer(three, 0, "locked"), 0, "locked").layers[0].locked, false);
assert.deepEqual([turnAt(0, 0, 0, -10, 0), turnAt(0, 0, 10, 0, 0), turnAt(0, 0, 0, 10, 0), turnAt(0, 0, -10, 0, 0), turnAt(0, 0, 10, -9, 15)], [0, 90, 180, -90, 45]);

console.log("panelEditor ok");
