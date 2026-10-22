// Changes of the panel designer (Panels.tsx) as pure functions on the panel list: new panel from the theme template,
// layers moved (snapped to the grid), resized, aligned, copied, reordered, added and removed, panels copied and
// reordered, the height kept in Twitch's range, undo and redo. Check: panelEditor.check.ts.
import { layerBox, PANEL_HEIGHT, PANEL_WIDTH, type Panel, type PanelDesign, type PanelLayer, rectLayer, textLayer } from "../core/panels.ts";

// The fonts the pages load (index.html), to choose for a text layer, grouped by kind so the list stays easy to scan
export const PANEL_FONT_GROUPS = [
  { kind: "plain", fonts: ["Inter", "Manrope", "DM Sans", "Space Grotesk", "Nunito"] },
  { kind: "playful", fonts: ["Fredoka", "Baloo 2", "Sniglet", "Pacifico", "Permanent Marker"] },
  { kind: "stencil", fonts: ["Black Ops One", "Stardos Stencil"] },
  { kind: "mono", fonts: ["Share Tech Mono", "Roboto Mono", "Fira Mono", "IBM Plex Mono", "VT323"] },
] as const;
export const PANEL_FONTS: readonly string[] = PANEL_FONT_GROUPS.flatMap(group => group.fonts);
// fixed: the largest picture a layer takes (it is kept inside the panel)
export const PANEL_IMAGE_BYTES = 400 * 1024;

export const newId = () => crypto.randomUUID();

// A panel named title in the look of the template
export const panelFrom = (title: string, design: PanelDesign): Panel => ({ id: newId(), name: title, ...design });

// The panel with its design replaced by the template, name and id stay
export const applyTemplate = (panel: Panel, design: PanelDesign): Panel => ({ ...panel, ...design });

export const clampHeight = (height: number) => Math.round(Math.min(PANEL_HEIGHT.max, Math.max(PANEL_HEIGHT.min, height || PANEL_HEIGHT.min)));

export function changeLayer(panel: Panel, index: number, change: Partial<PanelLayer>): Panel {
  return { ...panel, layers: panel.layers.map((layer, at) => (at === index ? ({ ...layer, ...change } as PanelLayer) : layer)) };
}

export const moveLayer = (panel: Panel, index: number, dx: number, dy: number) =>
  changeLayer(panel, index, { x: Math.round(panel.layers[index].x + dx), y: Math.round(panel.layers[index].y + dy) });

// One step up (+1, drawn later, on top) or down (-1); at the end it stays
export function reorderLayer(panel: Panel, index: number, step: 1 | -1): Panel {
  const target = index + step;
  if (target < 0 || target >= panel.layers.length) return panel;
  const layers = [...panel.layers];
  [layers[index], layers[target]] = [layers[target], layers[index]];
  return { ...panel, layers };
}

export const removeLayer = (panel: Panel, index: number): Panel => ({ ...panel, layers: panel.layers.filter((_, at) => at !== index) });

// New layers in the middle of the panel; colors and font from the first text of the panel, so they fit the look
export function addLayer(panel: Panel, kind: PanelLayer["kind"], src = ""): Panel {
  const sample = panel.layers.find(layer => layer.kind === "text");
  const color = sample?.kind === "text" ? sample.color : "#ffffff";
  const middle = panel.height / 2;
  const layer: PanelLayer = kind === "text"
    ? textLayer(newId(), 20, middle - 12, PANEL_WIDTH - 40, "Text", sample?.kind === "text" ? sample.font : PANEL_FONTS[0], 20, color)
    : kind === "rect"
      ? rectLayer(newId(), 40, middle - 20, PANEL_WIDTH - 80, 40, color, { radius: 8 })
      : { id: newId(), kind: "image", x: PANEL_WIDTH / 2 - 30, y: middle - 30, w: 60, h: 60, src, opacity: 1, rotate: 0 };
  return { ...panel, layers: [...panel.layers, layer] };
}

// Snaps a coordinate to the grid; grid 0 leaves it as it is
// fixed: how far a copy lands from its original (px)
const COPY_OFFSET = 8;

export const snap = (value: number, grid: number) => (grid > 0 ? Math.round(value / grid) * grid : Math.round(value));

// Moves a layer and snaps its top left corner to the grid (0 = free)
export function moveLayerSnapped(panel: Panel, index: number, x: number, y: number, grid: number): Panel {
  return changeLayer(panel, index, { x: snap(x, grid), y: snap(y, grid) });
}

// Resizes a layer by its bottom right corner (texts only in width), at least one grid step or 4 px
export function resizeLayer(panel: Panel, index: number, width: number, height: number, grid: number): Panel {
  const least = Math.max(grid, 4);
  const layer = panel.layers[index];
  const wide = Math.max(least, snap(width, grid));
  return changeLayer(panel, index, layer.kind === "text" ? { w: wide } : { w: wide, h: Math.max(least, snap(height, grid)) });
}

export type Alignment = "left" | "center" | "right" | "top" | "middle" | "bottom";
export type Box = { x: number; y: number; w: number; h: number };

// Puts a layer at an edge or the middle of an area (the whole panel unless given)
export function alignLayer(panel: Panel, index: number, how: Alignment, area: Box = { x: 0, y: 0, w: PANEL_WIDTH, h: panel.height }): Panel {
  const box = layerBox(panel.layers[index]);
  const spot = {
    left: { x: area.x }, center: { x: Math.round(area.x + (area.w - box.w) / 2) }, right: { x: Math.round(area.x + area.w - box.w) },
    top: { y: area.y }, middle: { y: Math.round(area.y + (area.h - box.h) / 2) }, bottom: { y: Math.round(area.y + area.h - box.h) },
  }[how];
  return changeLayer(panel, index, spot);
}

// The box around several layers
export function groupBox(panel: Panel, indices: readonly number[]): Box {
  const boxes = indices.map(index => layerBox(panel.layers[index]));
  const [left, top] = [Math.min(...boxes.map(box => box.x)), Math.min(...boxes.map(box => box.y))];
  return { x: left, y: top, w: Math.max(...boxes.map(box => box.x + box.w)) - left, h: Math.max(...boxes.map(box => box.y + box.h)) - top };
}

// One layer aligns to the panel, several align to the box around them (like other layer editors)
export function alignLayers(panel: Panel, indices: readonly number[], how: Alignment): Panel {
  const area = indices.length > 1 ? groupBox(panel, indices) : undefined;
  return indices.reduce((next, index) => alignLayer(next, index, how, area), panel);
}

export type Guides = { x: number[]; y: number[] };
// fixed: how close (px of the panel) an edge or middle must come to snap to a guide
export const GUIDE_REACH = 4;

// Smart guides: the step that puts an edge or the middle of the box onto the nearest edge or middle of the panel or of
// another visible layer within reach, per axis, and the lines to show for it
export function guideSnap(box: Box, panel: Panel, skip: readonly number[], reach = GUIDE_REACH): { dx: number; dy: number; guides: Guides } {
  const others = panel.layers.filter((layer, index) => !skip.includes(index) && !layer.hidden).map(layerBox);
  const marks = (start: number, size: number) => [start, start + size / 2, start + size];
  const nearest = (own: number[], targets: number[]) => {
    let best: { step: number; line: number } | null = null;
    for (const line of targets) for (const mark of own) if (Math.abs(line - mark) <= reach && (!best || Math.abs(line - mark) < Math.abs(best.step))) best = { step: line - mark, line };
    return best;
  };
  const x = nearest(marks(box.x, box.w), [...marks(0, PANEL_WIDTH), ...others.flatMap(other => marks(other.x, other.w))]);
  const y = nearest(marks(box.y, box.h), [...marks(0, panel.height), ...others.flatMap(other => marks(other.y, other.h))]);
  return { dx: x?.step ?? 0, dy: y?.step ?? 0, guides: { x: x ? [x.line] : [], y: y ? [y.line] : [] } };
}

// Moves several layers together by the pointer step from where the drag began: the corner of the group snaps to the
// grid (0 = free), then to the guides when they are on
export function moveGroup(base: Panel, indices: readonly number[], dx: number, dy: number, grid: number, guides: boolean): { panel: Panel; guides: Guides } {
  const box = groupBox(base, indices);
  const moved = { ...box, x: snap(box.x + dx, grid), y: snap(box.y + dy, grid) };
  const guided = guides ? guideSnap(moved, base, indices) : { dx: 0, dy: 0, guides: { x: [], y: [] } };
  const [stepX, stepY] = [Math.round(moved.x + guided.dx - box.x), Math.round(moved.y + guided.dy - box.y)];
  const panel = indices.reduce((next, index) => changeLayer(next, index, { x: base.layers[index].x + stepX, y: base.layers[index].y + stepY }), base);
  return { panel, guides: guided.guides };
}

export const removeLayers = (panel: Panel, indices: readonly number[]): Panel => ({ ...panel, layers: panel.layers.filter((_, index) => !indices.includes(index)) });

// Copies of several layers on top of all, a little offset; the answer names where the copies are
export function duplicateLayers(panel: Panel, indices: readonly number[]): { panel: Panel; copies: number[] } {
  const copies = [...indices].sort((one, two) => one - two).map(index => ({ ...panel.layers[index], id: newId(), x: panel.layers[index].x + COPY_OFFSET, y: panel.layers[index].y + COPY_OFFSET }));
  return { panel: { ...panel, layers: [...panel.layers, ...copies] }, copies: copies.map((_, at) => panel.layers.length + at) };
}

export const toggleLayer = (panel: Panel, index: number, flag: "hidden" | "locked") => changeLayer(panel, index, { [flag]: !panel.layers[index][flag] });

// The turn (degrees, -180 to 180, 0 = the handle straight above the middle) for the pointer at x, y around the middle
// cx, cy; step > 0 snaps to steps of that many degrees
export function turnAt(cx: number, cy: number, x: number, y: number, step: number): number {
  const turn = (Math.atan2(x - cx, cy - y) * 180) / Math.PI;
  const snapped = step > 0 ? Math.round(turn / step) * step : Math.round(turn);
  return snapped > 180 ? snapped - 360 : snapped;
}


export function duplicateLayer(panel: Panel, index: number): Panel {
  const layer = panel.layers[index];
  const copy = { ...layer, id: newId(), x: layer.x + COPY_OFFSET, y: layer.y + COPY_OFFSET };
  return { ...panel, layers: [...panel.layers.slice(0, index + 1), copy, ...panel.layers.slice(index + 1)] };
}

export const duplicatePanel = (panel: Panel, name: string): Panel => ({ ...panel, id: newId(), name, layers: panel.layers.map(layer => ({ ...layer, id: newId() })) });

// One place up (-1) or down (+1) in the panel list; at the end it stays
export function movePanel(panels: readonly Panel[], index: number, step: 1 | -1): Panel[] {
  const target = index + step;
  if (target < 0 || target >= panels.length) return [...panels];
  const moved = [...panels];
  [moved[index], moved[target]] = [moved[target], moved[index]];
  return moved;
}

// Undo history of the panel list: the newest state, what came before (newest last) and what was undone
export type History<T> = { past: T[]; present: T; future: T[] };
// fixed: how many steps can be undone
export const HISTORY_DEPTH = 100;

export const record = <T,>(history: History<T>, next: T): History<T> =>
  ({ past: [...history.past, history.present].slice(-HISTORY_DEPTH), present: next, future: [] });
export const undo = <T,>(history: History<T>): History<T> =>
  (history.past.length === 0 ? history : { past: history.past.slice(0, -1), present: history.past[history.past.length - 1], future: [history.present, ...history.future] });
export const redo = <T,>(history: History<T>): History<T> =>
  (history.future.length === 0 ? history : { past: [...history.past, history.present], present: history.future[0], future: history.future.slice(1) });
