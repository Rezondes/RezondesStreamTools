// Theme-Bereich im Dashboard: Theme wählen (speichert sofort), Szene wählen (Vorschau und die Gruppen, die in ihr
// wirken, siehe groupScenes; die Suche durchsucht alle), Formular aus dem Schema, gruppiert nach group; Speichern mit Fehlern je Feld, Zurücksetzen je Feld und für alles,
// Vorschau mit den ungespeicherten Werten. Gespeicherte Werte übernehmen die Overlays sofort (SSE).
import { useCallback, useEffect, useState } from "react";
import { isErrorCode, type ErrorCode } from "../core/errorCodes.ts";
import { resolveSettings, type SettingError, type SettingErrorCode } from "../core/settings.ts";
import { SCENES, type SceneName, type SettingValues, type ThemeSchema } from "../core/theme.ts";
import { DEFAULT_THEME, findTheme } from "../themes/registry.ts";
import { getJson, loadMedia, postJson } from "./api.ts";
import type { Me } from "./navigation.ts";
import ScenePreview from "./ScenePreview.tsx";
import SettingInput from "./SettingInput.tsx";
import { changedKeys, errorsByKey, groupFields, groupsForScene, groupsWithoutScene, resetAll, resetField } from "./settingsForm.ts";
import { TEXTS } from "./texts.de.ts";

// Antwort von GET /api/settings: gewähltes Theme, gespeicherte Werte je Theme, verfügbare Themes
type SettingsFile = { theme: string; values: Record<string, Record<string, unknown>>; themes: { id: string; name: string }[] };
type Notice = "saved" | "invalid" | ErrorCode | null;
type Draft = { values: SettingValues; set: (update: (values: SettingValues) => SettingValues) => void };

const defaultSchema = findTheme(DEFAULT_THEME)!;

export default function ThemeSettings({ me }: { me: Me }) {
  const { file, draft, setDraft, errors, notice, media, save, load } = useSettingsFile();
  const [search, setSearch] = useState("");
  const [scene, setScene] = useState<SceneName>("alerts");
  if (!file) {
    if (!notice || notice === "saved" || notice === "invalid") return <p className="muted">{TEXTS.loading}</p>;
    return (
      <p className="actions">
        <span className="error" role="alert">{TEXTS.errors[notice]}</span>
        <button className="btn" onClick={() => void load()}>{TEXTS.retry}</button>
      </p>
    );
  }
  const schema = findTheme(file.theme) ?? defaultSchema;
  const saved = resolveSettings(schema, file.values[schema.id]);
  const changed = changedKeys(saved, draft);
  const switchTheme = (id: string) => {
    if (changed.length > 0 && !confirm(TEXTS.theme.confirmSwitch(changed.length))) return;
    save(id, file.values[id] ?? {});
  };

  return (
    <section className="panel theme-settings">
      <label className="setting">
        {TEXTS.theme.choose}
        <select value={schema.id} onChange={event => switchTheme(event.target.value)}>
          {file.themes.map(theme => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
        </select>
      </label>
      <label className="setting">
        {TEXTS.theme.previewScene}
        <select value={scene} onChange={event => setScene(event.target.value as SceneName)}>
          {SCENES.map(name => <option key={name} value={name}>{TEXTS.scenes[name]}</option>)}
        </select>
      </label>

      <div className="actions settings-bar">
        <button className="btn primary" disabled={changed.length === 0} onClick={() => save(schema.id, draft)}>{TEXTS.theme.save}</button>
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
          <SettingsGroups schema={schema} scene={scene} search={search} draft={{ values: draft, set: setDraft }} errors={errors} media={media} />
          {groupsWithoutScene(schema).length > 0 && <p className="muted">{TEXTS.theme.elsewhere(groupsWithoutScene(schema).join(", "))}</p>}
        </div>
        <ScenePreview login={me.login} scene={scene} settings={{ theme: schema.id, values: resolveSettings(schema, draft) }} />
      </div>
    </section>
  );
}

// Gruppen der Szene, aufklappbar (die der Szene offen, Allgemein zu); mit Suche passende Felder aller Gruppen, alle offen
type GroupsProps = { schema: ThemeSchema; scene: SceneName; search: string; draft: Draft; errors: Record<string, SettingErrorCode>; media: readonly string[] };
function SettingsGroups({ schema, scene, search, draft, errors, media }: GroupsProps) {
  const query = search.trim().toLowerCase();
  const groups = (query ? groupFields(schema) : groupsForScene(schema, scene))
    .map(({ group, fields }) => ({ group, fields: query ? fields.filter(field => `${group} ${field.label}`.toLowerCase().includes(query)) : fields }))
    .filter(({ fields }) => fields.length > 0);
  if (groups.length === 0) return <p className="muted">{TEXTS.theme.noMatch}</p>;
  return (
    <>
      {groups.map(({ group, fields }) => (
        <details key={`${group}-${query ? "search" : scene}`} className="settings-group" open={Boolean(query) || group in (schema.groupScenes ?? {})}>
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

// Gespeicherte Einstellungen laden, Entwurf halten und speichern; Fehler des Servers je Feld oder als Code
function useSettingsFile() {
  const [file, setFile] = useState<SettingsFile | null>(null);
  const [draft, setDraft] = useState<SettingValues>({});
  const [errors, setErrors] = useState<Record<string, SettingErrorCode>>({});
  const [notice, setNotice] = useState<Notice>(null);
  const [media, setMedia] = useState<string[]>([]);

  const load = useCallback(async () => {
    setNotice(null);
    const loaded = await getJson<SettingsFile | null>("/api/settings", null);
    if (!loaded) return setNotice("server-error");
    setFile(loaded);
    setDraft(resolveSettings(findTheme(loaded.theme) ?? defaultSchema, loaded.values[loaded.theme]));
    setErrors({});
  }, []);

  useEffect(() => {
    load().catch((error: unknown) => console.warn("Loading settings failed:", error));
    // Medienliste nur mit freigegebenen Triggern; sonst bleibt die Auswahl leer
    loadMedia().then(list => setMedia(list.files.map(file => file.name))).catch((error: unknown) => console.warn("Loading media failed:", error));
  }, [load]);

  const save = (theme: string, values: unknown) => {
    postJson("/api/settings", { theme, values })
      .then(async result => {
        if (result.ok) {
          await load();
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

  return { file, draft, setDraft, errors, notice, media, save, load };
}
