// Theme section in the dashboard: choose a theme to view and edit (does not change the overlays), set it as the
// active theme only via a button; choose the view: general (groups that apply everywhere) or a scene (preview and
// the groups that apply in it, see groupScenes; the search searches all), form from the server's schema
// (GET /api/themes), grouped by group; save with errors per field, reset per field and for everything, preview with
// the unsaved values. The overlays take over saved values of the active theme immediately (SSE).
import { useCallback, useEffect, useState } from "react";
import type { ThemeSchema as ServerSchema } from "../generated/ThemeSchema.ts";
import { isErrorCode, type ErrorCode } from "../core/errorCodes.ts";
import { resolveSettings, type SettingError, type SettingErrorCode } from "../core/settings.ts";
import { SCENES, type SceneName, type SettingValues, type ThemeSchema } from "../core/theme.ts";
import { DEFAULT_THEME, findTheme } from "../themes/registry.ts";
import { getJson, loadMedia, postJson } from "./api.ts";
import type { Me } from "./navigation.ts";
import ScenePreview from "./ScenePreview.tsx";
import SettingInput from "./SettingInput.tsx";
import { changedKeys, errorsByKey, groupFields, groupsForView, groupsWithoutScene, pickSchema, resetAll, resetField, type FormView } from "./settingsForm.ts";
import { TEXTS } from "./texts.de.ts";

// Answer of GET /api/settings: chosen theme, saved values per theme, available themes
type SettingsFile = { theme: string; values: Record<string, Record<string, unknown>>; themes: { id: string; name: string }[] };
type Notice = "saved" | "invalid" | ErrorCode | null;
type Draft = { values: SettingValues; set: (update: (values: SettingValues) => SettingValues) => void };

const defaultSchema = findTheme(DEFAULT_THEME)!;

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
  // Preview: the last chosen scene, also while general is shown
  const [scene, setScene] = useState<SceneName>("alerts");
  const chooseView = (next: FormView) => {
    setView(next);
    if (next !== "general") setScene(next);
  };
  if (!file) {
    if (!notice || notice === "saved" || notice === "invalid") return <p className="muted">{TEXTS.loading}</p>;
    return (
      <p className="actions">
        <span className="error" role="alert">{TEXTS.errors[notice]}</span>
        <button className="btn" onClick={() => void load()}>{TEXTS.retry}</button>
      </p>
    );
  }
  const schema = schemaOf(viewed);
  const saved = resolveSettings(schema, file.values[schema.id]);
  const changed = changedKeys(saved, draft);
  const switchTheme = (id: string) => {
    if (changed.length > 0 && !confirm(TEXTS.theme.confirmSwitch(changed.length))) return;
    showTheme(id);
  };

  return (
    <section className="panel theme-settings">
      <ThemeChooser file={file} viewed={schema.id} onView={switchTheme} onActivate={() => save(true)} />
      <label className="setting">
        {TEXTS.theme.previewScene}
        <select value={view} onChange={event => chooseView(event.target.value as FormView)}>
          <option value="general">{TEXTS.theme.general}</option>
          {SCENES.map(name => <option key={name} value={name}>{TEXTS.scenes[name]}</option>)}
        </select>
      </label>

      <div className="actions settings-bar">
        <button className="btn primary" disabled={changed.length === 0} onClick={() => save(false)}>{TEXTS.theme.save}</button>
        <button className="btn" disabled={changed.length === 0} onClick={() => setDraft(() => saved)}>{TEXTS.theme.discard}</button>
        <button className="btn" onClick={() => { if (confirm(TEXTS.theme.confirmReset)) setDraft(() => resetAll(schema)); }}>{TEXTS.theme.resetAll}</button>
        <span className="muted" role="status">
          {changed.length > 0 ? `${TEXTS.theme.unsaved} ${changed.length}` : notice === "saved" ? TEXTS.theme.saved : ""}
        </span>
      </div>
      {notice === "invalid" && <p className="error" role="alert">{TEXTS.theme.invalid}</p>}
      {notice && notice !== "saved" && notice !== "invalid" && <p className="error" role="alert">{TEXTS.errors[notice]}</p>}

      <div className="settings-layout">
        <div className="settings-groups">
          <label className="setting">
            {TEXTS.theme.search}
            <input type="search" value={search} onChange={event => setSearch(event.target.value)} />
          </label>
          <SettingsGroups schema={schema} view={view} search={search} draft={{ values: draft, set: setDraft }} errors={errors} media={media} />
          {groupsWithoutScene(schema).length > 0 && <p className="muted">{TEXTS.theme.elsewhere(groupsWithoutScene(schema).join(", "))}</p>}
        </div>
        <ScenePreview login={me.login} overlayKey={me.overlayKey} scene={scene} settings={{ theme: schema.id, values: resolveSettings(schema, draft) }} />
      </div>
    </section>
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

// Groups of the view, collapsible and open; with a search the matching fields of all groups
type GroupsProps = { schema: ThemeSchema; view: FormView; search: string; draft: Draft; errors: Record<string, SettingErrorCode>; media: readonly string[] };
function SettingsGroups({ schema, view, search, draft, errors, media }: GroupsProps) {
  const query = search.trim().toLowerCase();
  const groups = (query ? groupFields(schema) : groupsForView(schema, view))
    .map(({ group, fields }) => ({ group, fields: query ? fields.filter(field => `${group} ${field.label}`.toLowerCase().includes(query)) : fields }))
    .filter(({ fields }) => fields.length > 0);
  if (groups.length === 0) return <p className="muted">{TEXTS.theme.noMatch}</p>;
  return (
    <>
      {groups.map(({ group, fields }) => (
        <details key={`${group}-${query ? "search" : view}`} className="settings-group" open>
          <summary>{group}</summary>
          {fields.map(field => (
            <SettingInput
              key={field.key}
              field={field}
              value={draft.values[field.key]}
              error={errors[field.key]}
              media={media}
              onChange={value => draft.set(current => ({ ...current, [field.key]: value }))}
              onReset={() => draft.set(current => resetField(schema, current, field.key))}
            />
          ))}
        </details>
      ))}
    </>
  );
}

// Loads saved settings, keeps the viewed theme with its draft and saves; server errors per
// field or as a code. save(activate): save the values of the viewed theme, with activate also as the active theme.
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

  const save = (activate: boolean) => {
    postJson("/api/settings", { theme: viewed, values: draft, choose: activate })
      .then(async result => {
        if (result.ok) {
          await load(viewed);
          // Another theme active: the dashboard reloads and afterwards looks like the new theme
          if (activate) return location.reload();
          return setNotice("saved");
        }
        if (Array.isArray(result.data)) {
          setErrors(errorsByKey(result.data as SettingError[]));
          return setNotice("invalid");
        }
        setNotice(typeof result.data === "string" && isErrorCode(result.data) ? result.data : "server-error");
      })
      .catch((error: unknown) => console.warn("Saving settings failed:", error));
  };

  return { file, viewed, showTheme, draft, setDraft, errors, notice, media, save, load };
}
