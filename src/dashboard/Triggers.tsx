// Trigger section in the dashboard, in two tabs: Trigger (the chat triggers of the logged-in streamer, triggers.json in
// the profile) and Chat-Befehle (the help command, ChatHelp.tsx). The triggers are a list on the left and the chosen
// one on the right, grouped into trigger, who and how often, actions (times and position folded away) and the commands
// page. Saving checks the rules on the server; on errors the file stays unchanged. Needs the running Twitch connection
// of the streamer (otherwise the error code not-connected comes back). Both tabs stay mounted, so switching keeps
// unsaved changes.
import { useEffect, useState } from "react";
import type { Trigger } from "../generated/Trigger.ts";
import type { When } from "../generated/When.ts";
import { isErrorCode } from "../core/errorCodes.ts";
import { MEDIA_KIND } from "../core/settings.ts";
import type { FxAction } from "../core/types.ts";
import { loadMedia, post } from "./api.ts";
import ChatHelp from "./ChatHelp.tsx";
import { reportError, toast } from "./notices.ts";
import type { Me } from "./navigation.ts";
import { SubTabs, subTabPanel } from "./SubTabs.tsx";
import { TEXTS } from "./texts.de.ts";
import UploadButton from "./UploadButton.tsx";

const TRIGGER_TEXT = TEXTS.triggers;
type WhenType = keyof typeof TRIGGER_TEXT.whenTypes;
const WHEN_TYPES = Object.keys(TRIGGER_TEXT.whenTypes) as WhenType[];
const ROLES = Object.keys(TRIGGER_TEXT.roles) as (keyof typeof TRIGGER_TEXT.roles)[];
const TABS = (["triggers", "chat"] as const).map(id => ({ id, label: TRIGGER_TEXT.tabs[id] }));
type Tab = (typeof TABS)[number]["id"];

const newAction = (): FxAction => ({ type: "media", zone: "main", duration: 4, position: "center" });
const newTrigger = (number: number): Trigger => ({ name: `trigger${number}`, when: { type: "word", match: "" }, who: ["everyone"], cooldown: 5, do: [newAction()] });

export default function Triggers({ me }: { me: Me }) {
  const [tab, setTab] = useState<Tab>("triggers");
  return (
    <section className="panel triggers">
      <SubTabs label={TRIGGER_TEXT.tabsLabel} tabs={TABS} current={tab} onChange={setTab} />
      <div className="section-area editor" {...subTabPanel("triggers")} hidden={tab !== "triggers"}><TriggerEditor /></div>
      <div className="section-area" {...subTabPanel("chat")} hidden={tab !== "chat"}>
        <section className="settings-group section-card"><ChatHelp login={me.login} /></section>
      </div>
    </section>
  );
}

// The errors of the server that name this trigger
const errorsOf = (errors: string[], trigger: Trigger) => errors.filter(error => error.startsWith(`Trigger "${trigger.name || "?"}":`));

function TriggerEditor() {
  const editor = useTriggerConfig();
  const { list, setList, saved, media, errors, dirty } = editor;
  const [current, setCurrent] = useState(0);
  if (!list) {
    return (
      <>
        {errors.map(error => <p key={error} className="error" role="alert">{error}</p>)}
        {errors.includes(TEXTS.errors["not-connected"]) && <a className="btn" href="#/account">{TRIGGER_TEXT.toConnections}</a>}
      </>
    );
  }

  const index = Math.max(0, Math.min(current, list.length - 1));
  const trigger = list.at(index);
  const add = () => { setList([...list, newTrigger(list.length + 1)]); setCurrent(list.length); };
  return (
    <>
      <div className="editor-bar">
        <button className="btn primary" disabled={!dirty} onClick={editor.save}>{TRIGGER_TEXT.save}</button>
        <button className="btn" disabled={!dirty} onClick={() => setList(JSON.parse(saved) as Trigger[])}>{TRIGGER_TEXT.discard}</button>
        {dirty && <span role="status">{TRIGGER_TEXT.unsaved}</span>}
        <UploadButton label={TRIGGER_TEXT.upload} onDone={editor.refreshMedia} />
      </div>

      <datalist id="media-image">{media.filter(name => MEDIA_KIND.image.test(name)).map(name => <option key={name} value={name} />)}</datalist>
      <datalist id="media-video">{media.filter(name => MEDIA_KIND.video.test(name)).map(name => <option key={name} value={name} />)}</datalist>
      <datalist id="media-audio">{media.filter(name => MEDIA_KIND.audio.test(name)).map(name => <option key={name} value={name} />)}</datalist>

      <div className="trigger-layout">
        <TriggerList list={list} current={index} errors={errors} onPick={setCurrent} onAdd={add} />
        {trigger ? (
          <TriggerCard
            key={index}
            trigger={trigger}
            dirty={dirty}
            errors={errorsOf(errors, trigger)}
            onChange={next => setList(list.map((candidate, position) => (position === index ? next : candidate)))}
            onCopy={() => { setList([...list.slice(0, index + 1), { ...structuredClone(trigger), name: `${trigger.name}${TRIGGER_TEXT.copySuffix}` }, ...list.slice(index + 1)]); setCurrent(index + 1); }}
            onDelete={() => { if (confirm(TRIGGER_TEXT.confirmDelete(trigger.name))) { setList(list.filter((_, position) => position !== index)); setCurrent(index - 1); } }}
          />
        ) : <p className="muted">{TRIGGER_TEXT.empty}</p>}
      </div>
    </>
  );
}

// All triggers to pick one: on or off (shape, not only color), name, what fires it, a mark when the server refused it
function TriggerList({ list, current, errors, onPick, onAdd }: { list: Trigger[]; current: number; errors: string[]; onPick: (index: number) => void; onAdd: () => void }) {
  return (
    <nav className="trigger-list" aria-label={TRIGGER_TEXT.listLabel}>
      <ul>
        {list.map((trigger, index) => (
          <li key={index}>
            <button type="button" className="trigger-item" aria-current={index === current} onClick={() => onPick(index)}>
              <span className="trigger-item-name">
                <span aria-hidden="true">{trigger.enabled === false ? "○" : "●"}</span> {trigger.name || "?"}
                {trigger.enabled === false && <span className="muted"> ({TRIGGER_TEXT.off})</span>}
                {errorsOf(errors, trigger).length > 0 && <span className="trigger-item-error"> ! {TRIGGER_TEXT.hasErrors}</span>}
              </span>
              <span className="muted">{TRIGGER_TEXT.whenTypes[trigger.when.type as WhenType] ?? trigger.when.type}: {trigger.when.match || "…"}</span>
            </button>
          </li>
        ))}
      </ul>
      <button className="btn" onClick={onAdd}>{TRIGGER_TEXT.add}</button>
    </nav>
  );
}

// Loads and saves rules, uploads media; dirty = unsaved changes
function useTriggerConfig() {
  const [list, setList] = useState<Trigger[] | null>(null);
  const [saved, setSaved] = useState("");
  const [media, setMedia] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const dirty = list !== null && JSON.stringify(list) !== saved;

  // Without a media list the selection stays empty; typing still works
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

  // Do not click away unsaved changes by accident
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Saved: a toast; refused: the errors stay at their trigger and come as the error dialog
  const refused = (found: string[]) => {
    setErrors(found);
    reportError(TRIGGER_TEXT.saveFailed, { Aktion: "POST /api/triggers/config", Meldungen: found.join(" | ") });
  };
  const save = () => {
    fetch("/api/triggers/config", { method: "POST", body: JSON.stringify({ triggers: list }) })
      .then(async response => {
        if (!response.ok) return refused(await response.json().catch(() => [TEXTS.errors["server-error"]]) as string[]);
        setSaved(JSON.stringify(list));
        setErrors([]);
        toast(TRIGGER_TEXT.saved);
      })
      .catch((failure: unknown) => refused([TEXTS.errors["server-error"], String(failure)]));
  };

  return { list, setList: (next: Trigger[]) => { setList(next); setErrors([]); }, saved, media, errors, dirty, save, refreshMedia };
}

type CardProps = { trigger: Trigger; dirty: boolean; errors: string[]; onChange: (trigger: Trigger) => void; onCopy: () => void; onDelete: () => void };

// Who may and how often
function Audience({ trigger, onChange }: { trigger: Trigger; onChange: (trigger: Trigger) => void }) {
  const who = trigger.who ?? ["everyone"];
  // "everyone" excludes the other roles and vice versa
  const toggleRole = (role: string) => {
    const rest = who.filter(current => current !== role && (role === "everyone" ? false : current !== "everyone"));
    const next = who.includes(role) ? rest : [...rest, role];
    onChange({ ...trigger, who: next.length ? next : ["everyone"] });
  };
  return (
    <fieldset className="trigger-group">
      <legend>{TRIGGER_TEXT.audienceTitle}</legend>
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
    </fieldset>
  );
}

// How the trigger appears on the commands page, folded away: most triggers keep the default
function PageEntry({ trigger, onChange }: { trigger: Trigger; onChange: (trigger: Trigger) => void }) {
  return (
    <details className="trigger-more">
      <summary>{TRIGGER_TEXT.pageTitle}</summary>
      <div className="row">
        <label className="check"><input type="checkbox" checked={trigger.public !== false} onChange={event => onChange({ ...trigger, public: event.target.checked })} /> {TRIGGER_TEXT.public}</label>
        <label className="grow">{TRIGGER_TEXT.description} <input value={trigger.description ?? ""} maxLength={200} placeholder={TRIGGER_TEXT.descriptionExample} onChange={event => onChange({ ...trigger, description: event.target.value || undefined })} /></label>
      </div>
    </details>
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
    <section className={`settings-group section-card trigger-card${trigger.enabled === false ? " disabled" : ""}`}>
      <div className="row">
        <label className="grow">{TRIGGER_TEXT.name} <input value={trigger.name} onChange={event => onChange({ ...trigger, name: event.target.value })} /></label>
        <label className="check"><input type="checkbox" checked={trigger.enabled !== false} onChange={event => onChange({ ...trigger, enabled: event.target.checked })} /> {TRIGGER_TEXT.enabled}</label>
        <TestButton name={trigger.name} dirty={dirty} />
        <button className="btn" onClick={onCopy}>{TRIGGER_TEXT.copy}</button>
        <button className="btn" onClick={onDelete}>{TRIGGER_TEXT.remove}</button>
      </div>
      {errors.length > 0 && <ul className="editor-errors">{errors.map(error => <li key={error}>{error}</li>)}</ul>}

      <fieldset className="trigger-group">
        <legend>{TRIGGER_TEXT.whenTitle}</legend>
        <div className="row">
          <label>{TRIGGER_TEXT.when}
            <select value={trigger.when.type} onChange={event => when({ type: event.target.value })}>
              {WHEN_TYPES.map(type => <option key={type} value={type}>{TRIGGER_TEXT.whenTypes[type]}</option>)}
            </select>
          </label>
          <label className="grow">{TRIGGER_TEXT.match} <input value={trigger.when.match} placeholder={TRIGGER_TEXT.matchExample} onChange={event => when({ match: event.target.value })} /></label>
          <label className="check"><input type="checkbox" checked={Boolean(trigger.when.caseSensitive)} onChange={event => when({ caseSensitive: event.target.checked })} /> {TRIGGER_TEXT.caseSensitive}</label>
        </div>
      </fieldset>

      <Audience trigger={trigger} onChange={onChange} />

      <h3>{TRIGGER_TEXT.actions}</h3>
      {trigger.do.map((action, index) => (
        <ActionRow
          key={index}
          number={index + 1}
          action={action}
          onChange={next => setAction(index, next)}
          onUp={index > 0 ? () => move(index, -1) : undefined}
          onDown={index < trigger.do.length - 1 ? () => move(index, 1) : undefined}
          onRemove={trigger.do.length > 1 ? () => onChange({ ...trigger, do: trigger.do.filter((_, position) => position !== index) }) : undefined}
        />
      ))}
      <button className="btn" onClick={() => onChange({ ...trigger, do: [...trigger.do, newAction()] })}>{TRIGGER_TEXT.addAction}</button>

      <PageEntry trigger={trigger} onChange={onChange} />
    </section>
  );
}

// Test fires the saved trigger: a toast when it fired, the error dialog when not
function TestButton({ name, dirty }: { name: string; dirty: boolean }) {
  const url = `/api/trigger?name=${encodeURIComponent(name)}`;
  const test = () => {
    post(url)
      .then(code => (code ? reportError(TEXTS.errors[code], { Aktion: `POST ${url}`, Code: code }) : toast(TRIGGER_TEXT.fired)))
      .catch((failure: unknown) => reportError(TEXTS.errors["server-error"], { Aktion: `POST ${url}`, Grund: String(failure) }));
  };
  return <button className="btn" disabled={dirty} title={dirty ? TRIGGER_TEXT.saveFirst : TRIGGER_TEXT.testHint} onClick={test}>{TRIGGER_TEXT.test}</button>;
}

type RowProps = { number: number; action: FxAction; onChange: (action: FxAction) => void; onUp?: () => void; onDown?: () => void; onRemove?: () => void };

// One action: what it shows and plays in front, times, size and position folded away
function ActionRow({ number, action, onChange, onUp, onDown, onRemove }: RowProps) {
  const set = (patch: Partial<FxAction>) => {
    const next: Record<string, unknown> = { ...action, ...patch };
    // Leave out empty fields so the JSON file stays readable
    for (const key of Object.keys(next)) if (next[key] === "" || next[key] === undefined) delete next[key];
    onChange(next as FxAction);
  };
  return (
    <div className="action-row">
      <div className="action-head">
        <span className="muted">{TRIGGER_TEXT.actionNumber(number)}</span>
        <span className="row-end">
          <button className="btn" disabled={!onUp} onClick={onUp} aria-label={TRIGGER_TEXT.moveUp}>▲</button>
          <button className="btn" disabled={!onDown} onClick={onDown} aria-label={TRIGGER_TEXT.moveDown}>▼</button>
          <button className="btn" disabled={!onRemove} onClick={onRemove} aria-label={TRIGGER_TEXT.removeAction}>✕</button>
        </span>
      </div>
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
      <details className="trigger-more">
        <summary>{TRIGGER_TEXT.timing}</summary>
        <ActionTiming action={action} first={number === 1} set={set} />
      </details>
    </div>
  );
}

// Times, size, volume, zone and position of an action
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

// Number field: empty = default (the field is left out)
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
