// Trigger-Bereich im Dashboard: Editor für die Chat-Trigger des angemeldeten Streamers (triggers.json im Profil).
// Speichern prüft die Regeln auf dem Server; bei Fehlern bleibt die Datei unverändert. Braucht die laufende
// Twitch-Verbindung des Streamers (sonst kommt der Fehlercode not-connected).
import { useEffect, useState } from "react";
import type { ErrorCode } from "../core/errorCodes.ts";
import type { Trigger, When } from "../../server/triggers.ts";
import { isErrorCode } from "../core/errorCodes.ts";
import { MEDIA_KIND } from "../core/settings.ts";
import type { FxAction } from "../core/types.ts";
import { loadMedia, post } from "./api.ts";
import { TEXTS } from "./texts.de.ts";
import UploadButton from "./UploadButton.tsx";

const TRIGGER_TEXT = TEXTS.triggers;
const WHEN_TYPES = Object.keys(TRIGGER_TEXT.whenTypes) as When["type"][];
const ROLES = Object.keys(TRIGGER_TEXT.roles) as (keyof typeof TRIGGER_TEXT.roles)[];

const newAction = (): FxAction => ({ type: "media", zone: "main", duration: 4, position: "center" });
const newTrigger = (number: number): Trigger => ({ name: `trigger${number}`, when: { type: "word", match: "" }, who: ["everyone"], cooldown: 5, do: [newAction()] });

export default function Triggers() {
  const editor = useTriggerConfig();
  const { list, setList, saved, media, errors, note, dirty } = editor;
  if (!list) {
    return (
      <section className="editor">
        {errors.map(error => <p key={error} className="error" role="alert">{error}</p>)}
        {errors.includes(TEXTS.errors["not-connected"]) && <a className="btn" href="#/connections">{TRIGGER_TEXT.toConnections}</a>}
      </section>
    );
  }

  const replace = (index: number, trigger: Trigger) => setList(list.map((current, position) => (position === index ? trigger : current)));
  return (
    <section className="editor">
      <div className="editor-bar">
        <button className="btn primary" disabled={!dirty} onClick={editor.save}>{TRIGGER_TEXT.save}</button>
        <button className="btn" disabled={!dirty} onClick={() => setList(JSON.parse(saved) as Trigger[])}>{TRIGGER_TEXT.discard}</button>
        <button className="btn" onClick={() => setList([...list, newTrigger(list.length + 1)])}>{TRIGGER_TEXT.add}</button>
        <span className={dirty ? "" : "muted"} role="status">{dirty ? TRIGGER_TEXT.unsaved : note}</span>
        <UploadButton label={TRIGGER_TEXT.upload} onDone={editor.refreshMedia} />
      </div>
      {errors.length > 0 && <ul className="editor-errors" role="alert">{errors.map(error => <li key={error}>{error}</li>)}</ul>}

      <datalist id="media-image">{media.filter(name => MEDIA_KIND.image.test(name)).map(name => <option key={name} value={name} />)}</datalist>
      <datalist id="media-video">{media.filter(name => MEDIA_KIND.video.test(name)).map(name => <option key={name} value={name} />)}</datalist>
      <datalist id="media-audio">{media.filter(name => MEDIA_KIND.audio.test(name)).map(name => <option key={name} value={name} />)}</datalist>

      {list.length === 0 && <p className="muted">{TRIGGER_TEXT.empty}</p>}
      {list.map((trigger, index) => (
        <TriggerCard
          key={index}
          trigger={trigger}
          dirty={dirty}
          errors={errors.filter(error => error.startsWith(`Trigger "${trigger.name || "?"}":`))}
          onChange={next => replace(index, next)}
          onCopy={() => setList([...list.slice(0, index + 1), { ...structuredClone(trigger), name: `${trigger.name}${TRIGGER_TEXT.copySuffix}` }, ...list.slice(index + 1)])}
          onDelete={() => { if (confirm(TRIGGER_TEXT.confirmDelete(trigger.name))) setList(list.filter((_, position) => position !== index)); }}
        />
      ))}
    </section>
  );
}

// Regeln laden und speichern, Medien hochladen; dirty = ungespeicherte Änderungen
function useTriggerConfig() {
  const [list, setList] = useState<Trigger[] | null>(null);
  const [saved, setSaved] = useState("");
  const [media, setMedia] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const dirty = list !== null && JSON.stringify(list) !== saved;

  // Ohne Medienliste bleibt die Auswahl leer; Eintippen geht trotzdem
  const refreshMedia = () => { loadMedia().then(loaded => setMedia(loaded.files.map(file => file.name))).catch(() => {}); };
  useEffect(() => {
    fetch("/api/triggers/config")
      .then(async response => {
        const text = await response.text();
        if (!response.ok) return setErrors([TEXTS.errors[isErrorCode(text) ? text : "server-error"]]);
        const config = JSON.parse(text) as { triggers: Trigger[] };
        setList(config.triggers);
        setSaved(JSON.stringify(config.triggers));
      })
      .catch(() => setErrors([TEXTS.errors["server-error"]]));
    refreshMedia();
  }, []);

  // Ungespeicherte Änderungen nicht aus Versehen wegklicken
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = () => {
    setNote("");
    fetch("/api/triggers/config", { method: "POST", body: JSON.stringify({ triggers: list }) })
      .then(async response => {
        if (!response.ok) return setErrors(await response.json().catch(() => [TEXTS.errors["server-error"]]) as string[]);
        setSaved(JSON.stringify(list));
        setErrors([]);
        setNote(TRIGGER_TEXT.saved);
      })
      .catch(() => setErrors([TEXTS.errors["server-error"]]));
  };

  return { list, setList: (next: Trigger[]) => { setList(next); setErrors([]); }, saved, media, errors, note, dirty, save, refreshMedia };
}

type CardProps = { trigger: Trigger; dirty: boolean; errors: string[]; onChange: (trigger: Trigger) => void; onCopy: () => void; onDelete: () => void };

// Wer darf, wie oft, und wie der Trigger auf der Befehlsseite erscheint
function AudienceRows({ trigger, onChange }: { trigger: Trigger; onChange: (trigger: Trigger) => void }) {
  const who = trigger.who ?? ["everyone"];
  // "alle" schliesst die anderen Rollen aus und umgekehrt
  const toggleRole = (role: string) => {
    const rest = who.filter(current => current !== role && (role === "everyone" ? false : current !== "everyone"));
    const next = who.includes(role) ? rest : [...rest, role];
    onChange({ ...trigger, who: next.length ? next : ["everyone"] });
  };
  return (
    <>
      <div className="row">
        <fieldset>
          <legend>{TRIGGER_TEXT.who}</legend>
          {ROLES.map(role => (
            <label key={role} className="check"><input type="checkbox" checked={who.includes(role)} onChange={() => toggleRole(role)} /> {TRIGGER_TEXT.roles[role]}</label>
          ))}
        </fieldset>
        <NumberField label={TRIGGER_TEXT.cooldown} value={trigger.cooldown} onChange={value => onChange({ ...trigger, cooldown: value })} />
        <NumberField label={TRIGGER_TEXT.userCooldown} value={trigger.userCooldown} onChange={value => onChange({ ...trigger, userCooldown: value })} />
      </div>
      <div className="row">
        <label className="check"><input type="checkbox" checked={trigger.public !== false} onChange={event => onChange({ ...trigger, public: event.target.checked })} /> {TRIGGER_TEXT.public}</label>
        <label className="grow">{TRIGGER_TEXT.description} <input value={trigger.description ?? ""} maxLength={200} placeholder={TRIGGER_TEXT.descriptionExample} onChange={event => onChange({ ...trigger, description: event.target.value || undefined })} /></label>
      </div>
    </>
  );
}

function TriggerCard({ trigger, dirty, errors, onChange, onCopy, onDelete }: CardProps) {
  const setAction = (index: number, action: FxAction) => onChange({ ...trigger, do: trigger.do.map((current, position) => (position === index ? action : current)) });
  const move = (index: number, by: number) => {
    const next = [...trigger.do];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    onChange({ ...trigger, do: next });
  };
  const when = (patch: Partial<When>) => onChange({ ...trigger, when: { ...trigger.when, ...patch } });

  return (
    <section className={`trigger-card${trigger.enabled === false ? " disabled" : ""}`}>
      <div className="row">
        <label className="grow">{TRIGGER_TEXT.name} <input value={trigger.name} onChange={event => onChange({ ...trigger, name: event.target.value })} /></label>
        <label className="check"><input type="checkbox" checked={trigger.enabled !== false} onChange={event => onChange({ ...trigger, enabled: event.target.checked })} /> {TRIGGER_TEXT.enabled}</label>
        <TestButton name={trigger.name} dirty={dirty} />
        <button className="btn" onClick={onCopy}>{TRIGGER_TEXT.copy}</button>
        <button className="btn" onClick={onDelete}>{TRIGGER_TEXT.remove}</button>
      </div>
      {errors.length > 0 && <ul className="editor-errors" role="alert">{errors.map(error => <li key={error}>{error}</li>)}</ul>}

      <div className="row">
        <label>{TRIGGER_TEXT.when}
          <select value={trigger.when.type} onChange={event => when({ type: event.target.value as When["type"] })}>
            {WHEN_TYPES.map(type => <option key={type} value={type}>{TRIGGER_TEXT.whenTypes[type]}</option>)}
          </select>
        </label>
        <label className="grow">{TRIGGER_TEXT.match} <input value={trigger.when.match} placeholder={TRIGGER_TEXT.matchExample} onChange={event => when({ match: event.target.value })} /></label>
        <label className="check"><input type="checkbox" checked={Boolean(trigger.when.caseSensitive)} onChange={event => when({ caseSensitive: event.target.checked })} /> {TRIGGER_TEXT.caseSensitive}</label>
      </div>

      <AudienceRows trigger={trigger} onChange={onChange} />

      <h3 className="muted">{TRIGGER_TEXT.actions}</h3>
      {trigger.do.map((action, index) => (
        <ActionRow
          key={index}
          action={action}
          first={index === 0}
          onChange={next => setAction(index, next)}
          onUp={index > 0 ? () => move(index, -1) : undefined}
          onDown={index < trigger.do.length - 1 ? () => move(index, 1) : undefined}
          onRemove={trigger.do.length > 1 ? () => onChange({ ...trigger, do: trigger.do.filter((_, position) => position !== index) }) : undefined}
        />
      ))}
      <button className="btn" onClick={() => onChange({ ...trigger, do: [...trigger.do, newAction()] })}>{TRIGGER_TEXT.addAction}</button>
    </section>
  );
}

// [ TEST ] löst den gespeicherten Trigger aus und meldet, ob es geklappt hat
function TestButton({ name, dirty }: { name: string; dirty: boolean }) {
  // undefined = noch nicht getestet, null = ausgelöst, sonst der Fehlercode
  const [tested, setTested] = useState<ErrorCode | null | undefined>(undefined);
  return (
    <>
      <button className="btn" disabled={dirty} title={dirty ? TRIGGER_TEXT.saveFirst : TRIGGER_TEXT.testHint}
        onClick={() => { post(`/api/trigger?name=${encodeURIComponent(name)}`).then(setTested).catch(() => setTested("server-error")); }}>{TRIGGER_TEXT.test}</button>
      {tested !== undefined && <span className={tested ? "error" : "muted"} role="status">{tested ? TEXTS.errors[tested] : TRIGGER_TEXT.fired}</span>}
    </>
  );
}

type RowProps = { action: FxAction; first: boolean; onChange: (action: FxAction) => void; onUp?: () => void; onDown?: () => void; onRemove?: () => void };

function ActionRow({ action, first, onChange, onUp, onDown, onRemove }: RowProps) {
  const set = (patch: Partial<FxAction>) => {
    const next: Record<string, unknown> = { ...action, ...patch };
    // Leere Felder weglassen, damit die JSON-Datei übersichtlich bleibt
    for (const key of Object.keys(next)) if (next[key] === "" || next[key] === undefined) delete next[key];
    onChange(next as FxAction);
  };
  return (
    <div className="action-row">
      <div className="row">
        <label>{TRIGGER_TEXT.kind}
          <select value={action.type} onChange={event => set({ type: event.target.value as FxAction["type"] })}>
            <option value="media">{TRIGGER_TEXT.kinds.media}</option>
            <option value="text">{TRIGGER_TEXT.kinds.text}</option>
          </select>
        </label>
        {action.type === "media" && <>
          <label className="grow">{TRIGGER_TEXT.image} <input list="media-image" value={action.image ?? ""} onChange={event => set({ image: event.target.value })} /></label>
          <label className="grow">{TRIGGER_TEXT.video} <input list="media-video" value={action.video ?? ""} onChange={event => set({ video: event.target.value })} /></label>
        </>}
        <label className="grow">{TRIGGER_TEXT.text} {action.type === "media" && TRIGGER_TEXT.optional}<input value={action.text ?? ""} placeholder={TRIGGER_TEXT.textExample} onChange={event => set({ text: event.target.value })} /></label>
        <label className="grow">{TRIGGER_TEXT.sound} <input list="media-audio" value={action.sound ?? ""} onChange={event => set({ sound: event.target.value })} /></label>
      </div>
      <ActionTiming action={action} first={first} set={set} />
      <div className="row">
        <span className="row-end">
          <button className="btn" disabled={!onUp} onClick={onUp} aria-label={TRIGGER_TEXT.moveUp}>[ ▲ ]</button>
          <button className="btn" disabled={!onDown} onClick={onDown} aria-label={TRIGGER_TEXT.moveDown}>[ ▼ ]</button>
          <button className="btn" disabled={!onRemove} onClick={onRemove} aria-label={TRIGGER_TEXT.removeAction}>[ ✕ ]</button>
        </span>
      </div>
    </div>
  );
}

// Zeiten, Grösse, Lautstärke, Zone und Position einer Aktion
function ActionTiming({ action, first, set }: { action: FxAction; first: boolean; set: (patch: Partial<FxAction>) => void }) {
  const position = action.position ?? "center";
  const custom = typeof position === "object";
  return (
    <div className="row">
      <NumberField label={TRIGGER_TEXT.delay} value={action.delay} onChange={value => set({ delay: value })} />
      <NumberField label={TRIGGER_TEXT.duration} value={action.duration} placeholder="4" onChange={value => set({ duration: value })} />
      <NumberField label={TRIGGER_TEXT.after} value={action.after} onChange={value => set({ after: value })} />
      <NumberField label={TRIGGER_TEXT.size} value={action.size} placeholder="360" step={10} onChange={value => set({ size: value })} />
      <NumberField label={TRIGGER_TEXT.volume} value={action.volume} step={0.1} placeholder="1" onChange={value => set({ volume: value })} />
      <label>{TRIGGER_TEXT.zone} <input value={action.zone ?? ""} placeholder="main" size={6} onChange={event => set({ zone: event.target.value })} /></label>
      <label>{TRIGGER_TEXT.position}
        <select value={custom ? "custom" : position} onChange={event => set({ position: event.target.value === "custom" ? { x: 50, y: 50 } : (event.target.value as "center" | "random") })}>
          <option value="center">{TRIGGER_TEXT.positions.center}</option>
          <option value="random">{TRIGGER_TEXT.positions.random}</option>
          <option value="custom">{TRIGGER_TEXT.positions.custom}</option>
        </select>
      </label>
      {custom && <>
        <NumberField label={TRIGGER_TEXT.x} value={position.x} step={1} onChange={value => set({ position: { x: value ?? 50, y: position.y } })} />
        <NumberField label={TRIGGER_TEXT.y} value={position.y} step={1} onChange={value => set({ position: { x: position.x, y: value ?? 50 } })} />
      </>}
      {!first && <label className="check"><input type="checkbox" checked={Boolean(action.together)} onChange={event => set({ together: event.target.checked || undefined })} /> {TRIGGER_TEXT.together}</label>}
    </div>
  );
}

// Zahlenfeld: leer = Standardwert (Feld wird weggelassen)
function NumberField({ label, value, onChange, step = 0.5, placeholder }: {
  label: string; value?: number; onChange: (value: number | undefined) => void; step?: number; placeholder?: string;
}) {
  return (
    <label>{label}
      <input type="number" min={0} step={step} value={value ?? ""} placeholder={placeholder}
        onChange={event => onChange(event.target.value === "" ? undefined : Number(event.target.value))} />
    </label>
  );
}
