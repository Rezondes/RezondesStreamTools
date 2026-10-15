// Theme-Bereich im Dashboard: Theme wählen (speichert sofort), alle Einstellungen des Themes im aus dem Schema
// erzeugten Formular, gruppiert nach group; Speichern mit Fehlern je Feld, Zurücksetzen je Feld und für alles,
// Vorschau mit den ungespeicherten Werten. Gespeicherte Werte übernehmen die Overlays sofort (SSE).
import { useCallback, useEffect, useState } from "react";
import { isErrorCode, type ErrorCode } from "../core/errorCodes.ts";
import { resolveSettings, type SettingError, type SettingErrorCode } from "../core/settings.ts";
import type { SettingValues, ThemeSchema } from "../core/theme.ts";
import { DEFAULT_THEME, findTheme } from "../themes/registry.ts";
import { getJson, loadMedia, postJson } from "./api.ts";
import type { Me } from "./navigation.ts";
import ScenePreview from "./ScenePreview.tsx";
import SettingInput from "./SettingInput.tsx";
import { changedKeys, errorsByKey, groupFields, resetAll, resetField } from "./settingsForm.ts";
import { TEXTS } from "./texts.de.ts";

// Antwort von GET /api/settings: gewähltes Theme, gespeicherte Werte je Theme, verfügbare Themes
type SettingsFile = { theme: string; values: Record<string, Record<string, unknown>>; themes: { id: string; name: string }[] };
type Notice = "saved" | "invalid" | ErrorCode | null;
type Draft = { values: SettingValues; set: (update: (values: SettingValues) => SettingValues) => void };

const defaultSchema = findTheme(DEFAULT_THEME)!;

export default function ThemeSettings({ me }: { me: Me }) {
  const { file, draft, setDraft, errors, notice, media, save } = useSettingsFile();
  if (!file) return <p className="muted">{notice && notice !== "saved" && notice !== "invalid" ? TEXTS.errors[notice] : TEXTS.loading}</p>;
  const schema = findTheme(file.theme) ?? defaultSchema;
  const changed = changedKeys(resolveSettings(schema, file.values[schema.id]), draft);

  return (
    <section className="panel theme-settings">
      <label className="setting">
        {TEXTS.theme.choose}
        <select value={schema.id} onChange={event => save(event.target.value, file.values[event.target.value] ?? {})}>
          {file.themes.map(theme => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
        </select>
      </label>

      <div className="actions settings-bar">
        <button className="btn primary" disabled={changed.length === 0} onClick={() => save(schema.id, draft)}>{TEXTS.theme.save}</button>
        <button className="btn" onClick={() => setDraft(() => resetAll(schema))}>{TEXTS.theme.resetAll}</button>
        <span className="muted" role="status">
          {changed.length > 0 ? `${TEXTS.theme.unsaved} ${changed.length}` : notice === "saved" ? TEXTS.theme.saved : ""}
        </span>
      </div>
      {notice === "invalid" && <p className="error" role="alert">{TEXTS.theme.invalid}</p>}
      {notice && notice !== "saved" && notice !== "invalid" && <p className="error" role="alert">{TEXTS.errors[notice]}</p>}

      <div className="settings-layout">
        <SettingsGroups schema={schema} draft={{ values: draft, set: setDraft }} errors={errors} media={media} />
        <ScenePreview login={me.login} settings={{ theme: schema.id, values: resolveSettings(schema, draft) }} />
      </div>
    </section>
  );
}

// Felder des Schemas, je Gruppe aufklappbar (die erste offen)
function SettingsGroups({ schema, draft, errors, media }: { schema: ThemeSchema; draft: Draft; errors: Record<string, SettingErrorCode>; media: readonly string[] }) {
  return (
    <div className="settings-groups">
      {groupFields(schema).map(({ group, fields }, index) => (
        <details key={group} className="settings-group" open={index === 0}>
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
    </div>
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

  return { file, draft, setDraft, errors, notice, media, save };
}
