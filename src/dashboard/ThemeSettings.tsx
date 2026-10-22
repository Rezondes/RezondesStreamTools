// Theme section in the dashboard: choose a theme to view and edit (does not change the overlays), set it as the
// active theme only via a button; the areas (general and the scenes) in a navigation on the left, the preview of the
// chosen scene on the right. Two modes: einfach shows the basic fields of the area, erweitert all of them, large groups
// split by kind (texts, colors, ...). The search searches all fields in both modes. Form from the server's schema
// (GET /api/themes); save with errors per field (the page jumps to the first one), reset per field and for everything,
// preview with the unsaved values. The overlays take over saved values of the active theme immediately (SSE).
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { ThemeSchema as ServerSchema } from "../generated/ThemeSchema.ts";
import { isErrorCode, type ErrorCode } from "../core/errorCodes.ts";
import { resolveSettings, type SettingError, type SettingErrorCode } from "../core/settings.ts";
import { SCENES, type SceneName, type SettingField, type SettingValues, type ThemeSchema } from "../core/theme.ts";
import { sceneNames } from "../core/themeRuntime.ts";
import { DEFAULT_THEME, findTheme } from "../themes/registry.ts";
import { THEME_SCENES } from "../themes/scenes.tsx";
import { getJson, loadMedia, postJson } from "./api.ts";
import { reportError, toast } from "./notices.ts";
import { visibleSections, type Me } from "./navigation.ts";
import ScenePreview from "./ScenePreview.tsx";
import SettingInput from "./SettingInput.tsx";
import {
  changedKeys, errorsByKey, fieldsByKind, groupFields, groupsForMode, groupsWithoutScene, hiddenKeys, pickSchema, resetAll, resetField, viewOfField,
  type FormMode, type FormView,
} from "./settingsForm.ts";
import { readMode, storeMode } from "./settingsMode.ts";
import { TEXTS } from "./texts.de.ts";

// Answer of GET /api/settings: chosen theme, saved values per theme, available themes
type SettingsFile = { theme: string; values: Record<string, Record<string, unknown>>; themes: { id: string; name: string }[] };
// Only a failed load stays on the page (with a retry); results of saving come as toast or error dialog
type Notice = ErrorCode | null;
type Draft = { values: SettingValues; set: (update: (values: SettingValues) => SettingValues) => void };

const defaultSchema = findTheme(DEFAULT_THEME)!;
// A group with more fields than this is split by kind in the advanced mode (at most 7 fields at once)
const SPLIT_ABOVE = 7;
const AREAS: readonly FormView[] = ["general", ...SCENES];
const areaName = (area: FormView) => (area === "general" ? TEXTS.theme.general : TEXTS.scenes[area]);

// Schemas of all themes from the server; null until it answered (or an old server without the route)
function useServerSchemas() {
  const [schemas, setSchemas] = useState<ServerSchema[] | null>(null);
  useEffect(() => {
    getJson<ServerSchema[] | null>("/api/themes", null).then(setSchemas).catch(() => setSchemas(null));
  }, []);
  return useCallback((id: string) => pickSchema(schemas, findTheme, defaultSchema, id), [schemas]);
}

export default function ThemeSettings({ me }: { me: Me }) {
  const schemaOf = useServerSchemas();
  const { file, viewed, showTheme, draft, setDraft, errors, notice, media, save, load } = useSettingsFile(schemaOf);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<FormView>("general");
  const [mode, setMode] = useState<FormMode>(() => readMode());
  // The field to show after a jump (hidden change or server error): its kind opens, it scrolls into view
  const [focus, setFocus] = useState<string | null>(null);
  // Preview: the scene of the chosen area; general (also on opening) shows the starting screen
  const [scene, setScene] = useState<SceneName>("starting");
  useEffect(() => {
    if (focus) document.getElementById(`setting-${focus}`)?.scrollIntoView({ block: "center" });
  }, [focus]);
  if (!file) return <Loading notice={notice} onRetry={() => void load()} />;

  const schema = schemaOf(viewed);
  const saved = resolveSettings(schema, file.values[schema.id]);
  const changed = changedKeys(saved, draft);
  const chooseView = (next: FormView) => {
    setView(next);
    setFocus(null);
    setScene(next === "general" ? "starting" : next);
  };
  const chooseMode = (next: FormMode) => { setMode(next); storeMode(next); };
  // Show a field wherever it is: its area, the advanced mode if it is not basic, no search
  const reveal = (key: string) => {
    const area = viewOfField(schema, key);
    if (area === "render") return;
    chooseView(area);
    if (hiddenKeys(schema, area, mode, [key]).length > 0) chooseMode("erweitert");
    setSearch("");
    setFocus(key);
  };
  const switchTheme = (id: string) => {
    if (changed.length > 0 && !confirm(TEXTS.theme.confirmSwitch(changed.length))) return;
    showTheme(id);
  };
  const hidden = search.trim() ? [] : hiddenKeys(schema, view, mode, changed).filter(key => viewOfField(schema, key) !== "render");

  return (
    <section className="panel theme-settings">
      <div className="settings-head">
        <ThemeChooser file={file} viewed={schema.id} onView={switchTheme} onActivate={() => save(true, reveal)} />
        <ModeSwitch mode={mode} onChange={chooseMode} />
      </div>
      <SaveBar
        changed={changed.length} hidden={hidden} onSave={() => save(false, reveal)} onShow={reveal}
        onDiscard={() => setDraft(() => saved)} onReset={() => { if (confirm(TEXTS.theme.confirmReset)) setDraft(() => resetAll(schema)); }}
      />

      <div className="settings-layout">
        <AreaNav schema={schema} view={view} changed={new Set(changed.map(key => viewOfField(schema, key)))} render={visibleSections(me).includes("render")} onChoose={chooseView} />
        <div className="settings-groups">
          <label className="setting">
            {TEXTS.theme.search}
            <input type="search" value={search} onChange={event => setSearch(event.target.value)} />
          </label>
          <SettingsGroups schema={schema} view={view} mode={mode} search={search} focus={focus} draft={{ values: draft, set: setDraft }} errors={errors} media={media} onAdvanced={() => chooseMode("erweitert")} />
        </div>
        <ScenePreview login={me.login} overlayKey={me.overlayKey} scene={scene} available={sceneNames(THEME_SCENES, schema.id).includes(scene)} settings={{ theme: schema.id, values: resolveSettings(schema, draft) }} />
      </div>
    </section>
  );
}

// Save, discard and reset with the count of unsaved changes (and a link to those not visible)
type SaveBarProps = {
  changed: number; hidden: readonly string[]; onSave: () => void; onDiscard: () => void; onReset: () => void; onShow: (key: string) => void;
};
function SaveBar({ changed, hidden, onSave, onDiscard, onReset, onShow }: SaveBarProps) {
  return (
    <>
      <div className="actions settings-bar">
        <button className="btn primary" disabled={changed === 0} onClick={onSave}>{TEXTS.theme.save}</button>
        <button className="btn" disabled={changed === 0} onClick={onDiscard}>{TEXTS.theme.discard}</button>
        <button className="btn" onClick={onReset}>{TEXTS.theme.resetAll}</button>
        <span className="muted" role="status">
          {changed > 0 ? `${TEXTS.theme.unsaved} ${changed}` : ""}
          {hidden.length > 0 && <> ({TEXTS.theme.hiddenChanges(hidden.length)}, <button type="button" className="link" onClick={() => onShow(hidden[0])}>{TEXTS.theme.showHidden}</button>)</>}
        </span>
      </div>
    </>
  );
}

// While the settings load, or the error with a retry
function Loading({ notice, onRetry }: { notice: Notice; onRetry: () => void }) {
  if (!notice) return <p className="muted">{TEXTS.loading}</p>;
  return (
    <p className="actions">
      <span className="error" role="alert">{TEXTS.errors[notice]}</span>
      <button className="btn" onClick={onRetry}>{TEXTS.retry}</button>
    </p>
  );
}

// Choose a theme to view (the active one is marked) and set the chosen one as the overlays' active theme
type ChooserProps = { file: SettingsFile; viewed: string; onView: (id: string) => void; onActivate: () => void };
function ThemeChooser({ file, viewed, onView, onActivate }: ChooserProps) {
  const activeName = file.themes.find(theme => theme.id === file.theme)?.name ?? file.theme;
  return (
    <div className="actions">
      <label className="setting">
        {TEXTS.theme.choose}
        <select value={viewed} onChange={event => onView(event.target.value)}>
          {file.themes.map(theme => (
            <option key={theme.id} value={theme.id}>{theme.id === file.theme ? `${theme.name} ${TEXTS.theme.activeMark}` : theme.name}</option>
          ))}
        </select>
      </label>
      {viewed === file.theme
        ? <span className="muted">{TEXTS.theme.isActive}</span>
        : (
          <>
            <button className="btn primary" onClick={onActivate}>{TEXTS.theme.activate}</button>
            <span className="muted">{TEXTS.theme.notActive(activeName)}</span>
          </>
        )}
    </div>
  );
}

// Two-way switch between the simple and the advanced mode
function ModeSwitch({ mode, onChange }: { mode: FormMode; onChange: (mode: FormMode) => void }) {
  return (
    <div className="settings-mode" role="group" aria-label={TEXTS.theme.mode}>
      {(["einfach", "erweitert"] as const).map(option => (
        <button key={option} type="button" aria-pressed={mode === option} onClick={() => onChange(option)}>
          {option === "einfach" ? TEXTS.theme.simple : TEXTS.theme.advanced}
        </button>
      ))}
    </div>
  );
}

// Areas of the form: general and the scenes (scenes the theme lacks are marked), areas with unsaved changes get a
// dot; stinger and banners are edited in the render section
type NavProps = { schema: ThemeSchema; view: FormView; changed: ReadonlySet<string>; render: boolean; onChoose: (view: FormView) => void };
function AreaNav({ schema, view, changed, render, onChoose }: NavProps) {
  const inTheme = sceneNames(THEME_SCENES, schema.id);
  return (
    <nav className="settings-nav" aria-label={TEXTS.theme.areas}>
      {AREAS.map(area => (
        <button key={area} type="button" className="settings-nav-item" aria-current={area === view ? "true" : undefined} onClick={() => onChoose(area)}>
          <span>
            {areaName(area)}
            {area !== "general" && !inTheme.includes(area) && <small className="muted"> ({TEXTS.theme.missing})</small>}
          </span>
          {changed.has(area) && <span className="settings-nav-dot" role="img" aria-label={TEXTS.theme.areaChanged}>●</span>}
        </button>
      ))}
      {render && groupsWithoutScene(schema).length > 0 && <a className="settings-nav-item" href="#/render">{TEXTS.theme.renderArea}</a>}
    </nav>
  );
}

// The groups of the area in the mode; with a search the matching fields of all areas, each group with its area
type GroupsProps = {
  schema: ThemeSchema; view: FormView; mode: FormMode; search: string; focus: string | null; draft: Draft;
  errors: Record<string, SettingErrorCode>; media: readonly string[]; onAdvanced: () => void;
};
function SettingsGroups({ schema, view, mode, search, focus, draft, errors, media, onAdvanced }: GroupsProps) {
  const query = search.trim().toLowerCase();
  const input = (field: SettingField) => (
    <SettingInput
      key={field.key}
      field={field}
      value={draft.values[field.key]}
      error={errors[field.key]}
      media={media}
      onChange={value => draft.set(current => ({ ...current, [field.key]: value }))}
      onReset={() => draft.set(current => resetField(schema, current, field.key))}
    />
  );
  if (query) {
    const found = groupFields(schema)
      .map(({ group, fields }) => ({ group, fields: fields.filter(field => `${group} ${field.label}`.toLowerCase().includes(query)) }))
      .filter(({ fields }) => fields.length > 0);
    if (found.length === 0) return <p className="muted">{TEXTS.theme.noMatch}</p>;
    return found.map(({ group, fields }) => {
      const area = viewOfField(schema, fields[0].key);
      return <Group key={`${group}-search`} title={`${group} · ${area === "render" ? TEXTS.theme.renderArea : areaName(area)}`} fields={fields} split={false} focus={focus} input={input} />;
    });
  }
  const groups = groupsForMode(schema, view, mode);
  if (groups.length === 0) {
    if (mode === "erweitert") return <p className="muted">{TEXTS.theme.emptyArea}</p>;
    return (
      <div className="settings-empty">
        <p className="muted">{TEXTS.theme.onlyAdvanced}</p>
        <button type="button" className="btn" onClick={onAdvanced}>{TEXTS.theme.showAdvanced}</button>
      </div>
    );
  }
  return groups.map(({ group, fields }) => (
    <Group key={`${group}-${view}-${mode}`} title={group} fields={fields} split={mode === "erweitert"} focus={focus} input={input} />
  ));
}

// One collapsible group; split: more than SPLIT_ABOVE fields are divided by kind, texts open, colors as a grid
type GroupProps = { title: string; fields: readonly SettingField[]; split: boolean; focus: string | null; input: (field: SettingField) => ReactNode };
function Group({ title, fields, split, focus, input }: GroupProps) {
  return (
    <details className="settings-group" open>
      <summary>{title}</summary>
      {split && fields.length > SPLIT_ABOVE
        ? fieldsByKind(fields).map(({ kind, fields: ofKind }) => (
          <details key={kind} className="settings-kind" open={kind === "texts" || ofKind.some(field => field.key === focus)}>
            <summary>{TEXTS.theme.kinds[kind]} ({ofKind.length})</summary>
            <div className={kind === "colors" ? "settings-colors" : undefined}>{ofKind.map(input)}</div>
          </details>
        ))
        : fields.map(input)}
    </details>
  );
}

// Loads saved settings, keeps the viewed theme with its draft and saves; server errors per field or as a code.
// save(activate, onInvalid): save the values of the viewed theme, with activate also as the active theme; onInvalid
// gets the first field the server refused.
function useSettingsFile(schemaOf: (id: string) => ThemeSchema) {
  const [file, setFile] = useState<SettingsFile | null>(null);
  const [viewed, setViewed] = useState("");
  const [draft, setDraft] = useState<SettingValues>({});
  const [errors, setErrors] = useState<Record<string, SettingErrorCode>>({});
  const [notice, setNotice] = useState<Notice>(null);
  const [media, setMedia] = useState<string[]>([]);

  // theme: the theme viewed afterwards, without it the active one
  const load = useCallback(async (theme?: string) => {
    setNotice(null);
    const loaded = await getJson<SettingsFile | null>("/api/settings", null);
    if (!loaded) return setNotice("server-error");
    const id = theme ?? loaded.theme;
    setFile(loaded);
    setViewed(id);
    setDraft(resolveSettings(schemaOf(id), loaded.values[id]));
    setErrors({});
  }, [schemaOf]);

  // View another theme: its saved state becomes the draft, the overlays stay as they are
  const showTheme = (id: string) => {
    setViewed(id);
    setDraft(resolveSettings(schemaOf(id), file?.values[id]));
    setErrors({});
    setNotice(null);
  };

  useEffect(() => {
    load().catch((error: unknown) => console.warn("Loading settings failed:", error));
    // Media list only with released triggers; otherwise the selection stays empty
    loadMedia().then(list => setMedia(list.files.map(file => file.name))).catch((error: unknown) => console.warn("Loading media failed:", error));
  }, [load]);

  const save = (activate: boolean, onInvalid: (key: string) => void) => {
    postJson("/api/settings", { theme: viewed, values: draft, choose: activate })
      .then(async result => {
        if (result.ok) {
          await load(viewed);
          // Another theme active: the dashboard reloads and afterwards looks like the new theme
          if (activate) return location.reload();
          return toast(TEXTS.theme.saved);
        }
        const details = { Aktion: "POST /api/settings", Theme: viewed, Antwort: JSON.stringify(result.data) };
        if (Array.isArray(result.data)) {
          const refused = result.data as SettingError[];
          setErrors(errorsByKey(refused));
          if (refused.length > 0) onInvalid(refused[0].key);
          return reportError(TEXTS.theme.invalid, details);
        }
        reportError(TEXTS.errors[typeof result.data === "string" && isErrorCode(result.data) ? result.data : "server-error"], details);
      })
      .catch((failure: unknown) => reportError(TEXTS.errors["server-error"], { Aktion: "POST /api/settings", Theme: viewed, Grund: String(failure) }));
  };

  return { file, viewed, showTheme, draft, setDraft, errors, notice, media, save, load };
}
