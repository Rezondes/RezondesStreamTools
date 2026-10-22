// Panel designer: Twitch panels of the streamer (GET/POST /api/panels), independent of the theme. Three columns: the
// panels as thumbnails (add, copy, reorder, delete), the stage with its toolbar (PanelStage.tsx) and the layers with
// the inspector (PanelFields.tsx); saving and saving the pictures stay on top. A new panel starts from the template of
// the active theme (panelFor). Every change can be undone (panelEditor.ts keeps the history), so deleting asks nothing.
import { useEffect, useRef, useState } from "react";
import { drawPanel, type Panel, PANEL_FORMATS, PANEL_MAX_BYTES, PANEL_WIDTH, type PanelFormat, panelFileName } from "../core/panels.ts";
import { resolveSettings } from "../core/settings.ts";
import type { SettingValues } from "../core/theme.ts";
import { DEFAULT_THEME, findTheme } from "../themes/registry.ts";
import { panelFor } from "../themes/renderers.ts";
import { getJson, postJson } from "./api.ts";
import type { Me } from "./navigation.ts";
import {
  addLayer, alignLayers, applyTemplate, changeLayer, duplicateLayers, duplicatePanel, type History, movePanel, PANEL_IMAGE_BYTES, panelFrom, record, redo,
  removeLayers, reorderLayer, toggleLayer, undo,
} from "./panelEditor.ts";
import { Inspector, LayerList, PanelFields, Segmented } from "./PanelFields.tsx";
import { loadFonts, PanelStage, PanelToolbar, type StageActions, type StageView } from "./PanelStage.tsx";
import { TEXTS } from "./texts.de.ts";

const TEXT = TEXTS.panels;
// fixed: JPG quality from the first try down to the lowest, in steps
const QUALITY = { start: 0.92, lowest: 0.4, step: 0.08 };

type SettingsFile = { theme: string; values: Record<string, Record<string, unknown>> };

export default function Panels({ me }: { me: Me }) {
  const [values, setValues] = useState<SettingValues>({});
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<readonly number[]>([]);
  const [view, setView] = useState<StageView>({ grid: false, step: 10, snap: true, guides: true, zoom: 2 });
  const store = usePanelStore(() => setSelected([]));
  const panels = store.history?.present;
  const images = useImages(panels ?? []);
  const schema = findTheme(me.theme) ?? findTheme(DEFAULT_THEME)!;
  useEffect(() => {
    void getJson<SettingsFile | null>("/api/settings", null).then(file => setValues(resolveSettings(schema, file?.values[schema.id])));
  }, [schema]);
  if (!panels) return <p className="muted">{TEXTS.loading}</p>;
  const panel = panels.at(current);
  const template = (title: string) => panelFor(schema.id, resolveSettings(schema, values), title);
  const withPanel = (next: Panel) => panels.map((candidate, index) => (index === current ? next : candidate));
  const pick = (index: number) => { setCurrent(index); setSelected([]); };
  const gallery = {
    pick,
    add: () => { store.commit([...panels, panelFrom(TEXT.newTitle, template(TEXT.newTitle))]); pick(panels.length); },
    duplicate: () => { if (panel) { store.commit([...panels.slice(0, current + 1), duplicatePanel(panel, TEXT.copyName(panel.name)), ...panels.slice(current + 1)]); pick(current + 1); } },
    move: (step: 1 | -1) => { store.commit(movePanel(panels, current, step)); setCurrent(Math.min(panels.length - 1, Math.max(0, current + step))); },
    remove: () => { store.commit(panels.filter((_, index) => index !== current)); pick(Math.max(0, current - 1)); store.setNotice(TEXT.removed); },
  };
  return (
    <section className="panel panel-designer">
      <div className="panel-designer-bar">
        <SaveBar dirty={store.dirty} saving={store.saving} notice={store.notice} onSave={store.save} onDiscard={store.discard} />
        {panel && <Export panels={panels} current={current} images={images} setNotice={store.setNotice} />}
      </div>
      <div className="panel-designer-layout">
        <PanelGallery panels={panels} current={current} images={images} actions={gallery} />
        {panel ? (
          <PanelEditor panel={panel} images={images} selected={selected} setSelected={setSelected} view={view} setView={setView} store={store}
            commit={next => store.commit(withPanel(next))} preview={next => store.preview(withPanel(next))} onTemplate={() => store.commit(withPanel(applyTemplate(panel, template(panel.name))))} />
        ) : <p className="muted panel-empty">{TEXT.empty(schema.name)}</p>}
      </div>
    </section>
  );
}

type Store = ReturnType<typeof usePanelStore>;

// The stage column and the property column of the open panel
function PanelEditor({ panel, images, selected, setSelected, view, setView, store, commit, preview, onTemplate }: {
  panel: Panel; images: ReadonlyMap<string, HTMLImageElement>; selected: readonly number[]; setSelected: (indices: readonly number[]) => void; view: StageView;
  setView: (view: StageView) => void; store: Store; commit: (panel: Panel) => void; preview: (panel: Panel) => void; onTemplate: () => void;
}) {
  // the inspector shows one layer; several selected share only the toolbar
  const layer = selected.length === 1 ? panel.layers.at(selected[0]) : undefined;
  const added = (next: Panel) => { commit(next); setSelected([next.layers.length - 1]); };
  // shift takes a layer in or out; a plain click on a selected layer keeps the group, so it can be dragged together
  const select = (index: number, extend: boolean) => {
    if (index < 0) { if (!extend) setSelected([]); return; }
    if (extend) setSelected(selected.includes(index) ? selected.filter(one => one !== index) : [...selected, index]);
    else if (!selected.includes(index)) setSelected([index]);
  };
  const actions: StageActions = {
    select, gestureStart: store.gestureStart, preview, commit, undo: store.undo, redo: store.redo,
    add: kind => added(addLayer(panel, kind)),
    addImage: file => readImage(file, src => added(addLayer(panel, "image", src)), store.setNotice),
    align: how => { if (selected.length > 0) commit(alignLayers(panel, selected, how)); },
    duplicate: () => { if (selected.length > 0) { const copied = duplicateLayers(panel, selected); commit(copied.panel); setSelected(copied.copies); } },
    remove: () => { if (selected.length > 0) { commit(removeLayers(panel, selected)); setSelected([]); } },
  };
  return (
    <>
      <div className="panel-editor">
        <PanelToolbar view={view} setView={setView} actions={actions} count={selected.length} canUndo={store.canUndo} canRedo={store.canRedo} />
        <PanelStage panel={panel} images={images} selected={selected} view={view} actions={actions} />
        <p className="muted">{TEXT.stageHint}</p>
      </div>
      <div className="settings-groups panel-properties">
        <LayerList panel={panel} selected={selected} onSelect={(index, extend) => (extend ? select(index, true) : setSelected([index]))} onToggle={(index, flag) => commit(toggleLayer(panel, index, flag))}
          onReorder={(index, step) => { commit(reorderLayer(panel, index, step)); setSelected([index + step]); }} />
        {layer ? <Inspector key={layer.id} layer={layer} change={change => commit(changeLayer(panel, selected[0], change))} /> : <PanelFields panel={panel} update={commit} onTemplate={onTemplate} />}
      </div>
    </>
  );
}

type GalleryActions = { pick: (index: number) => void; add: () => void; duplicate: () => void; move: (step: 1 | -1) => void; remove: () => void };

// The panels as small pictures in their order on Twitch, the open one marked; its actions below the list
function PanelGallery({ panels, current, images, actions }: { panels: readonly Panel[]; current: number; images: ReadonlyMap<string, HTMLImageElement>; actions: GalleryActions }) {
  return (
    <nav className="panel-gallery" aria-label={TEXT.gallery}>
      <button type="button" className="btn" onClick={actions.add}>{TEXT.add}</button>
      <ol className="panel-thumbs">
        {panels.map((panel, index) => (
          <li key={panel.id}>
            <button type="button" className="panel-thumb" aria-current={index === current} onClick={() => actions.pick(index)}>
              <Thumb panel={panel} images={images} />
              <span>{index + 1}. {panel.name || TEXT.unnamed}</span>
            </button>
          </li>
        ))}
      </ol>
      {panels.length > 0 && (
        <div className="actions">
          <button type="button" className="btn" aria-label={TEXT.panelUp} title={TEXT.panelUp} disabled={current === 0} onClick={() => actions.move(-1)}>▲</button>
          <button type="button" className="btn" aria-label={TEXT.panelDown} title={TEXT.panelDown} disabled={current === panels.length - 1} onClick={() => actions.move(1)}>▼</button>
          <button type="button" className="btn" onClick={actions.duplicate}>{TEXT.duplicate}</button>
          <button type="button" className="btn" onClick={actions.remove}>{TEXT.delete}</button>
        </div>
      )}
    </nav>
  );
}

function Thumb({ panel, images }: { panel: Panel; images: ReadonlyMap<string, HTMLImageElement> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    void loadFonts(panel).then(() => { const context = canvas.current?.getContext("2d"); if (context) drawPanel(context, panel, images); });
  }, [panel, images]);
  return <canvas ref={canvas} width={PANEL_WIDTH} height={panel.height} aria-hidden="true" />;
}

// The saved panel list and the draft with its undo history: load, change (one undo step each, a drag only once),
// save (with its state and a specific error), discard (undoable too)
function usePanelStore(onReset: () => void) {
  const [history, setHistory] = useState<History<Panel[]> | null>(null);
  const [saved, setSaved] = useState("[]");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    void getJson<{ panels: Panel[] }>("/api/panels", { panels: [] }).then(answer => { setHistory({ past: [], present: answer.panels, future: [] }); setSaved(JSON.stringify(answer.panels)); });
  }, []);
  const change = (step: (history: History<Panel[]>) => History<Panel[]>) => { setHistory(now => (now ? step(now) : now)); setNotice(""); };
  const save = () => {
    const panels = history?.present ?? [];
    setSaving(true);
    void postJson("/api/panels", { panels }).then(result => {
      if (result.ok) setSaved(JSON.stringify(panels));
      setNotice(result.ok ? TEXT.saved : saveError(result.data));
      setSaving(false);
    });
  };
  return {
    history, saving, notice, setNotice, save,
    dirty: history !== null && JSON.stringify(history.present) !== saved,
    canUndo: (history?.past.length ?? 0) > 0, canRedo: (history?.future.length ?? 0) > 0,
    commit: (next: Panel[]) => change(now => record(now, next)),
    gestureStart: () => change(now => record(now, now.present)),
    preview: (next: Panel[]) => setHistory(now => (now ? { ...now, present: next } : now)),
    undo: () => change(undo), redo: () => change(redo),
    discard: () => { change(now => record(now, JSON.parse(saved) as Panel[])); onReset(); setNotice(TEXT.discarded); },
  };
}

// The pictures of all image layers, loaded once per src; draws again when one arrives
function useImages(panels: readonly Panel[]): ReadonlyMap<string, HTMLImageElement> {
  const [images, setImages] = useState<ReadonlyMap<string, HTMLImageElement>>(new Map());
  useEffect(() => {
    for (const layer of panels.flatMap(panel => panel.layers)) {
      if (layer.kind !== "image" || !layer.src || images.has(layer.src)) continue;
      const image = new Image();
      image.onload = () => setImages(loaded => new Map(loaded).set(layer.src, image));
      image.src = layer.src;
    }
  }, [panels, images]);
  return images;
}

// Saved: the button names what it saves and says when it runs; without changes it says so instead of just greying out
function SaveBar({ dirty, saving, notice, onSave, onDiscard }: { dirty: boolean; saving: boolean; notice: string; onSave: () => void; onDiscard: () => void }) {
  return (
    <div className="actions">
      <button type="button" className="btn primary" disabled={!dirty || saving} onClick={onSave}>{saving ? TEXT.saving : TEXT.save}</button>
      <button type="button" className="btn" disabled={!dirty || saving} onClick={onDiscard}>{TEXT.discard}</button>
      <span className="muted" role="status">{notice || (dirty ? TEXT.unsaved : TEXT.clean)}</span>
    </div>
  );
}

// What went wrong when saving, by the answer of the server
const saveError = (data: unknown) => (Array.isArray(data) ? TEXT.invalid : data === "too-large" ? TEXT.bodyTooLarge : TEXT.saveFailed);

// A chosen or dropped picture as a data URL, or the reason it is refused
function readImage(file: File, done: (src: string) => void, refuse: (notice: string) => void) {
  if (!file.type.startsWith("image/")) return refuse(TEXT.notAnImage(file.name));
  if (file.size > PANEL_IMAGE_BYTES) return refuse(TEXT.imageTooLarge(file.name));
  const reader = new FileReader();
  reader.onload = () => done(reader.result as string);
  reader.readAsDataURL(file);
}

// File format and the buttons that save the current or every panel
function Export({ panels, current, images, setNotice }: { panels: readonly Panel[]; current: number; images: ReadonlyMap<string, HTMLImageElement>; setNotice: (notice: string) => void }) {
  const [format, setFormat] = useState<PanelFormat>("png");
  const [busy, setBusy] = useState(false);
  const run = (job: () => Promise<string>) => { setBusy(true); void job().then(notice => { setNotice(notice); setBusy(false); }); };
  return (
    <div className="actions panel-export">
      <Segmented label={TEXT.format} value={format} options={PANEL_FORMATS.map(name => ({ value: name, label: name.toUpperCase() }))} onChange={setFormat} />
      <button type="button" className="btn" disabled={busy} onClick={() => run(() => download(panels[current], current, format, images))}>{busy ? TEXT.downloading : TEXT.download}</button>
      <button type="button" className="btn" disabled={busy} onClick={() => run(() => downloadAll(panels, format, images))}>{busy ? TEXT.downloading : TEXT.downloadAll}</button>
    </div>
  );
}

// The picture of a panel as a file of at most 1 MB: JPG gets less quality until it fits, PNG as it is
async function picture(panel: Panel, format: PanelFormat, images: ReadonlyMap<string, HTMLImageElement>): Promise<Blob | null> {
  await loadFonts(panel);
  const canvas = document.createElement("canvas");
  [canvas.width, canvas.height] = [PANEL_WIDTH, panel.height];
  const context = canvas.getContext("2d");
  if (!context) return null;
  drawPanel(context, panel, images);
  const blob = (quality?: number) => new Promise<Blob | null>(done => canvas.toBlob(done, format === "jpg" ? "image/jpeg" : "image/png", quality));
  if (format === "png") return blob();
  for (let quality = QUALITY.start; quality >= QUALITY.lowest; quality -= QUALITY.step) {
    const made = await blob(quality);
    if (!made || made.size <= PANEL_MAX_BYTES) return made;
  }
  return blob(QUALITY.lowest);
}

// Saves one panel; the answer is the notice for the page
async function download(panel: Panel, index: number, format: PanelFormat, images: ReadonlyMap<string, HTMLImageElement>): Promise<string> {
  const blob = await picture(panel, format, images);
  if (!blob) return TEXT.saveFailed;
  if (blob.size > PANEL_MAX_BYTES) return TEXT.tooLarge(panel.name);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = panelFileName(panel.name, index, format);
  link.click();
  URL.revokeObjectURL(link.href);
  return TEXT.downloaded(link.download);
}

async function downloadAll(panels: readonly Panel[], format: PanelFormat, images: ReadonlyMap<string, HTMLImageElement>): Promise<string> {
  const notices: string[] = [];
  for (const [index, panel] of panels.entries()) notices.push(await download(panel, index, format, images));
  return notices.at(-1) ?? "";
}
