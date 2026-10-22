// Stage of the panel designer (Panels.tsx): the toolbar (add layers, undo and redo, align, copy and delete, grid,
// snapping, guides, zoom) and the canvas with the optional grid, the center lines, the smart guides while dragging and
// the selection. Shift adds a layer to the selection or takes it out; several layers move together. One selected layer
// gets a resize handle (bottom right) and a turn handle (above). A drag is one undo step (gestureStart records, preview
// follows the pointer). Keys work while the stage has the focus.
import { type DragEvent, type KeyboardEvent, type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import { drawPanel, layerAt, layerBox, type Panel, PANEL_WIDTH, type PanelLayer } from "../core/panels.ts";
import { type Alignment, changeLayer, type Guides, moveGroup, resizeLayer, turnAt } from "./panelEditor.ts";
import { TEXTS } from "./texts.de.ts";

const TEXT = TEXTS.panels;
// fixed: the grid steps to choose (px of the panel), the zoom levels, how far the arrow keys nudge with shift (px), the
// turn steps while snapping (degrees)
export const GRID_STEPS = [5, 10, 20, 40] as const;
export const ZOOMS = [1, 2, 3] as const;
const BIG_NUDGE = 10;
const TURN_STEP = 15;
const NO_GUIDES: Guides = { x: [], y: [] };
const ALIGNMENTS: readonly { how: Alignment; mark: string }[] = [
  { how: "left", mark: "⇤" }, { how: "center", mark: "⇹" }, { how: "right", mark: "⇥" }, { how: "top", mark: "⤒" }, { how: "middle", mark: "⇳" }, { how: "bottom", mark: "⤓" },
];

export type StageView = { grid: boolean; step: number; snap: boolean; guides: boolean; zoom: number };
export type StageActions = {
  // index -1 clears; extend (shift) adds the layer to the selection or takes it out
  select: (index: number, extend: boolean) => void;
  gestureStart: () => void;
  preview: (panel: Panel) => void;
  commit: (panel: Panel) => void;
  add: (kind: PanelLayer["kind"]) => void;
  addImage: (file: File) => void;
  align: (how: Alignment) => void;
  duplicate: () => void;
  remove: () => void;
  undo: () => void;
  redo: () => void;
};

type Gesture = { kind: "move" | "resize" | "turn"; x: number; y: number; base: Panel; indices: readonly number[] };

// The selected layers the stage may change: locked ones stay where they are
const unlocked = (panel: Panel, indices: readonly number[]) => indices.filter(index => panel.layers[index] && !panel.layers[index].locked);

export function PanelToolbar({ view, setView, actions, count, canUndo, canRedo }: {
  view: StageView; setView: (view: StageView) => void; actions: StageActions; count: number; canUndo: boolean; canRedo: boolean;
}) {
  const file = useRef<HTMLInputElement>(null);
  const toggle = (key: "grid" | "snap" | "guides", label: string) => (
    <label className="setting-row"><input type="checkbox" checked={view[key]} onChange={event => setView({ ...view, [key]: event.target.checked })} /> {label}</label>
  );
  return (
    <div className="panel-toolbar" role="toolbar" aria-label={TEXT.toolbar}>
      <span className="panel-tools">
        <button type="button" className="btn" onClick={() => actions.add("text")}>{TEXT.addText}</button>
        <button type="button" className="btn" onClick={() => actions.add("rect")}>{TEXT.addRect}</button>
        <button type="button" className="btn" onClick={() => file.current?.click()}>{TEXT.addImage}</button>
        <input ref={file} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={event => { const chosen = event.target.files?.[0]; if (chosen) actions.addImage(chosen); event.target.value = ""; }} />
      </span>
      <span className="panel-tools">
        <button type="button" className="btn" disabled={!canUndo} title={TEXT.undoKey} aria-label={TEXT.undo} onClick={actions.undo}>↶</button>
        <button type="button" className="btn" disabled={!canRedo} title={TEXT.redoKey} aria-label={TEXT.redo} onClick={actions.redo}>↷</button>
      </span>
      <span className="panel-tools" role="group" aria-label={count > 1 ? TEXT.alignSelection : TEXT.alignGroup}>
        {ALIGNMENTS.map(({ how, mark }) => (
          <button key={how} type="button" className="btn" disabled={count === 0} title={TEXT.alignTo[how]} aria-label={TEXT.alignTo[how]} onClick={() => actions.align(how)}>{mark}</button>
        ))}
        <button type="button" className="btn" disabled={count === 0} title={TEXT.duplicateKey} onClick={actions.duplicate}>{TEXT.duplicate}</button>
        <button type="button" className="btn" disabled={count === 0} title={TEXT.removeKey} onClick={actions.remove}>{TEXT.removeLayer}</button>
      </span>
      <span className="panel-tools">
        {toggle("grid", TEXT.grid)}
        <select value={view.step} aria-label={TEXT.gridStep} onChange={event => setView({ ...view, step: Number(event.target.value) })}>
          {GRID_STEPS.map(step => <option key={step} value={step}>{step} px</option>)}
        </select>
        {toggle("snap", TEXT.snap)}
        {toggle("guides", TEXT.guides)}
      </span>
      <span className="panel-tools" role="group" aria-label={TEXT.zoom}>
        {ZOOMS.map(zoom => (
          <button key={zoom} type="button" className={`btn${view.zoom === zoom ? " primary" : ""}`} aria-pressed={view.zoom === zoom} onClick={() => setView({ ...view, zoom })}>{zoom}×</button>
        ))}
      </span>
    </div>
  );
}

// The keys of the stage: undo and redo always; with a selection nudge (shift: further), delete, copy, deselect
function stageKeys(event: KeyboardEvent, panel: Panel, selected: readonly number[], grid: number, actions: StageActions) {
  const mod = event.ctrlKey || event.metaKey;
  const key = event.key.toLowerCase();
  const step = event.shiftKey ? BIG_NUDGE : grid || 1;
  const arrows: Record<string, [number, number]> = { arrowleft: [-step, 0], arrowright: [step, 0], arrowup: [0, -step], arrowdown: [0, step] };
  const run = (action: () => void) => { event.preventDefault(); action(); };
  if (mod && key === "z") return run(event.shiftKey ? actions.redo : actions.undo);
  if (mod && key === "y") return run(actions.redo);
  if (selected.length === 0) return;
  const free = unlocked(panel, selected);
  if (arrows[key]) return run(() => { if (free.length > 0) actions.commit(moveGroup(panel, free, arrows[key][0], arrows[key][1], 0, false).panel); });
  if (key === "delete" || key === "backspace") return run(actions.remove);
  if (mod && key === "d") return run(actions.duplicate);
  if (key === "escape") actions.select(-1, false);
}

// The fonts of the text layers, so the canvas does not draw with a fallback
export const loadFonts = (panel: Panel) => Promise.all(panel.layers.flatMap(layer => (layer.kind === "text" ? [document.fonts.load(`${layer.weight} ${layer.size}px "${layer.font}"`)] : [])));

export function PanelStage({ panel, images, selected, view, actions }: { panel: Panel; images: ReadonlyMap<string, HTMLImageElement>; selected: readonly number[]; view: StageView; actions: StageActions }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const [guides, setGuides] = useState<Guides>(NO_GUIDES);
  useEffect(() => {
    void loadFonts(panel).then(() => { const context = canvas.current?.getContext("2d"); if (context) drawPanel(context, panel, images); });
  }, [panel, images]);
  const grid = view.snap ? view.step : 0;
  const zoom = view.zoom;
  const at = (event: ReactPointerEvent) => {
    const box = canvas.current!.getBoundingClientRect();
    return { x: ((event.clientX - box.left) / box.width) * PANEL_WIDTH, y: ((event.clientY - box.top) / box.height) * panel.height };
  };
  const begin = (event: ReactPointerEvent, kind: Gesture["kind"], chosen: readonly number[]) => {
    const indices = unlocked(panel, chosen);
    if (indices.length === 0) return;
    gesture.current = { kind, ...at(event), base: panel, indices };
    actions.gestureStart();
    event.currentTarget.setPointerCapture(event.pointerId);
    event.stopPropagation();
  };
  const follow = (event: ReactPointerEvent) => {
    const now = gesture.current;
    if (!now) return;
    const point = at(event);
    const [dx, dy] = [point.x - now.x, point.y - now.y];
    const [index] = now.indices;
    const box = layerBox(now.base.layers[index]);
    if (now.kind === "move") {
      const moved = moveGroup(now.base, now.indices, dx, dy, grid, view.guides);
      setGuides(moved.guides);
      actions.preview(moved.panel);
    } else if (now.kind === "resize") actions.preview(resizeLayer(now.base, index, box.w + dx, box.h + dy, grid));
    else actions.preview(changeLayer(now.base, index, { rotate: turnAt(box.x + box.w / 2, box.y + box.h / 2, point.x, point.y, view.snap ? TURN_STEP : 0) }));
  };
  const press = (event: ReactPointerEvent) => {
    const point = at(event);
    const index = layerAt(panel, point.x, point.y);
    actions.select(index, event.shiftKey);
    if (index < 0 || event.shiftKey) return;
    begin(event, "move", selected.includes(index) ? selected : [index]);
  };
  return (
    <div className="panel-stage-box">
      <div
        className="panel-stage" tabIndex={0} aria-label={TEXT.stage(panel.name)} style={{ width: PANEL_WIDTH * zoom, height: panel.height * zoom }}
        onKeyDown={event => stageKeys(event, panel, selected, grid, actions)} onDragOver={event => event.preventDefault()}
        onDrop={(event: DragEvent) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) actions.addImage(file); }}
        onPointerDown={press} onPointerMove={follow} onPointerUp={() => { gesture.current = null; setGuides(NO_GUIDES); }}
      >
        <canvas ref={canvas} width={PANEL_WIDTH} height={panel.height} />
        {view.grid && <i className="panel-grid" style={{ backgroundSize: `${view.step * zoom}px ${view.step * zoom}px` }} />}
        {view.grid && <i className="panel-center" />}
        {guides.x.map(x => <i key={`x${x}`} className="panel-guide vertical" style={{ left: x * zoom }} />)}
        {guides.y.map(y => <i key={`y${y}`} className="panel-guide horizontal" style={{ top: y * zoom }} />)}
        <Selection panel={panel} selected={selected} zoom={zoom} onHandle={(event, kind) => begin(event, kind, selected)} />
      </div>
    </div>
  );
}

// The outlines of the selected layers; one alone gets the resize handle and the turn handle
function Selection({ panel, selected, zoom, onHandle }: { panel: Panel; selected: readonly number[]; zoom: number; onHandle: (event: ReactPointerEvent, kind: "resize" | "turn") => void }) {
  return selected.filter(index => panel.layers[index]).map(index => {
    const box = layerBox(panel.layers[index]);
    const alone = selected.length === 1 && !panel.layers[index].locked;
    return (
      <i key={panel.layers[index].id} className="panel-select" style={{ left: box.x * zoom, top: box.y * zoom, width: box.w * zoom, height: box.h * zoom }}>
        {alone && <b className="panel-handle" title={TEXT.resize} onPointerDown={event => onHandle(event, "resize")} />}
        {alone && <b className="panel-turn" title={TEXT.turn} onPointerDown={event => onHandle(event, "turn")} />}
      </i>
    );
  });
}
