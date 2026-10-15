// Ein Eingabefeld je Feldtyp des Theme-Schemas, mit sichtbarem Label (Regel 23), Fehlertext zum Code des Servers
// und Zurücksetzen auf den Standard, sobald der Wert davon abweicht. Medien und Töne wählen aus dem Medienordner.
import { MEDIA_KIND, type SettingErrorCode } from "../core/settings.ts";
import type { SettingField, SettingValue, SoundValue } from "../core/theme.ts";
import { isDefault } from "./settingsForm.ts";
import { TEXTS } from "./texts.de.ts";

type Props = {
  field: SettingField;
  value: SettingValue | undefined;
  error: SettingErrorCode | undefined;
  media: readonly string[];
  onChange: (value: SettingValue) => void;
  onReset: () => void;
};

const COLOR = /^#[0-9a-f]{6}/i;
const asText = (value: SettingValue | undefined, fallback = "") => (typeof value === "string" ? value : fallback);
const isSound = (value: unknown): value is SoundValue => typeof value === "object" && value !== null && "file" in value && "volume" in value;

export default function SettingInput({ field, value, error, media, onChange, onReset }: Props) {
  const id = `setting-${field.key}`;
  return (
    <div className={`setting${error ? " invalid" : ""}`}>
      <label htmlFor={id}>{field.label}{field.type === "number" && field.unit ? ` (${field.unit})` : ""}</label>
      <Input id={id} field={field} value={value} media={media} onChange={onChange} invalid={Boolean(error)} />
      {!isDefault(field, value) && <button type="button" className="btn" onClick={onReset}>{TEXTS.theme.resetField}</button>}
      {error && <span className="setting-error" role="alert">{TEXTS.errors[error]}</span>}
    </div>
  );
}

type InputProps = Pick<Props, "field" | "value" | "media" | "onChange"> & { id: string; invalid: boolean };

function Input({ id, field, value, media, onChange, invalid }: InputProps) {
  const common = { id, "aria-invalid": invalid || undefined };
  switch (field.type) {
    case "color": {
      const text = typeof value === "string" ? value : field.default;
      return (
        <span className="setting-row">
          <input type="color" aria-label={`${TEXTS.theme.colorPicker} ${field.label}`} value={COLOR.test(text) ? text.slice(0, 7).toLowerCase() : field.default.slice(0, 7)} onChange={event => onChange(event.target.value)} />
          <input {...common} type="text" value={text} maxLength={9} spellCheck={false} onChange={event => onChange(event.target.value)} />
        </span>
      );
    }
    case "text":
      return <input {...common} type="text" value={asText(value)} maxLength={field.maxLength} onChange={event => onChange(event.target.value)} />;
    case "textarea":
      return <textarea {...common} rows={6} value={asText(value)} maxLength={field.maxLength} spellCheck={false} onChange={event => onChange(event.target.value)} />;
    case "lines": {
      const lines = Array.isArray(value) ? value : field.default;
      return <textarea {...common} rows={Math.min(12, lines.length + 1)} value={lines.join("\n")} spellCheck={false} onChange={event => onChange(event.target.value.split("\n"))} />;
    }
    case "number":
      return (
        <input {...common} type="number" min={field.min} max={field.max} step={field.step ?? 1}
          value={typeof value === "number" && Number.isFinite(value) ? value : ""}
          onChange={event => onChange(event.target.value === "" ? Number.NaN : Number(event.target.value))} />
      );
    case "boolean":
      return <input {...common} type="checkbox" checked={value === true} onChange={event => onChange(event.target.checked)} />;
    case "select":
    case "font":
      return (
        <select {...common} value={asText(value, field.default)} onChange={event => onChange(event.target.value)}>
          {field.options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      );
    case "media":
      return <MediaSelect {...common} value={asText(value)} files={media.filter(file => MEDIA_KIND[field.accept].test(file))} none={TEXTS.theme.noMedia} onChange={onChange} />;
    case "sound": {
      const sound = isSound(value) ? value : field.default;
      return (
        <span className="setting-row">
          <MediaSelect {...common} value={sound.file} files={media.filter(file => MEDIA_KIND.audio.test(file))} none={TEXTS.theme.builtInSound} onChange={file => onChange({ ...sound, file })} />
          <label className="setting-volume">
            {TEXTS.theme.volume}
            <input type="range" min={0} max={1} step={0.05} value={sound.volume} onChange={event => onChange({ ...sound, volume: Number(event.target.value) })} />
          </label>
        </span>
      );
    }
  }
}

function MediaSelect({ id, value, files, none, onChange }: { id: string; value: string; files: readonly string[]; none: string; onChange: (file: string) => void }) {
  // Eine gespeicherte, inzwischen gelöschte Datei bleibt wählbar, damit der Wert sichtbar ist
  const options = value && !files.includes(value) ? [value, ...files] : files;
  return (
    <select id={id} value={value} onChange={event => onChange(event.target.value)}>
      <option value="">{none}</option>
      {options.map(file => <option key={file} value={file}>{file}</option>)}
    </select>
  );
}
