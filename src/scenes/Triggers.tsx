// Editor für die Chat-Trigger des angemeldeten Streamers (triggers.json im Profil) im Browser. Braucht den Overlay-Server.
// Speichern prüft die Regeln auf dem Server; bei Fehlern bleibt die Datei unverändert.
import { useEffect, useState } from "react";
import type { Trigger, When } from "../../server/triggers.ts";
import type { FxAction } from "../core/types.ts";

const WHEN: { value: When["type"]; label: string }[] = [
  { value: "word", label: "ganzes Wort" },
  { value: "contains", label: "enthält" },
  { value: "exact", label: "ganze Nachricht" },
  { value: "command", label: "Befehl am Anfang" },
  { value: "regex", label: "regulärer Ausdruck" },
];
const ROLES = [
  { value: "everyone", label: "alle" },
  { value: "subscriber", label: "Subs" },
  { value: "vip", label: "VIPs" },
  { value: "moderator", label: "Mods" },
  { value: "broadcaster", label: "nur ich" },
];
const IMAGE = /\.(gif|png|jpe?g|webp|svg)$/i;
const VIDEO = /\.(mp4|webm)$/i;
const AUDIO = /\.(mp3|wav|ogg)$/i;

const newAction = (): FxAction => ({ type: "media", zone: "main", duration: 4, position: "center" });
const newTrigger = (n: number): Trigger => ({
  name: `trigger${n}`,
  when: { type: "word", match: "" },
  who: ["everyone"],
  cooldown: 5,
  do: [newAction()],
});

export default function Triggers() {
  const [list, setList] = useState<Trigger[] | null>(null);
  const [saved, setSaved] = useState("");
  const [media, setMedia] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [note, setNote] = useState("");

  // Ohne Medienliste bleibt die Auswahl leer; Eintippen geht trotzdem
  const loadMedia = () => { fetch("/api/media").then(r => r.json()).then(setMedia).catch(() => {}); };
  useEffect(() => {
    fetch("/api/triggers/config")
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(c => { setList(c.triggers); setSaved(JSON.stringify(c.triggers)); })
      .catch(() => setErrors(["Overlay-Server nicht erreichbar. Der Editor braucht den Docker-Container."]));
    loadMedia();
  }, []);

  const dirty = list !== null && JSON.stringify(list) !== saved;
  // Ungespeicherte Änderungen nicht aus Versehen wegklicken
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (!list) return <main className="editor">{errors.map(e => <p key={e} className="error">{e}</p>)}</main>;

  const set = (i: number, t: Trigger) => setList(list.map((x, k) => (k === i ? t : x)));

  async function save() {
    setNote("");
    const res = await fetch("/api/triggers/config", { method: "POST", body: JSON.stringify({ triggers: list }) });
    if (res.ok) {
      setSaved(JSON.stringify(list));
      setErrors([]);
      setNote("Gespeichert. Die Trigger sind sofort aktiv.");
    } else {
      setErrors(await res.json().catch(() => ["Speichern fehlgeschlagen"]));
    }
  }

  async function upload(files: FileList | null) {
    for (const f of Array.from(files ?? [])) {
      const res = await fetch(`/api/media?name=${encodeURIComponent(f.name)}`, { method: "POST", body: f });
      setNote(res.ok ? `Hochgeladen: ${f.name}` : `${f.name}: ${await res.text()}`);
    }
    loadMedia();
  }

  return (
    <main className="editor">
      <header className="editor-head">
        <h1 className="glow">CHAT-TRIGGER</h1>
        <a className="btn" href="#/">[ ÜBERSICHT ]</a>
      </header>

      <section className="editor-bar">
        <button className="btn primary" disabled={!dirty} onClick={save}>[ SPEICHERN ]</button>
        <button className="btn" disabled={!dirty} onClick={() => { setList(JSON.parse(saved)); setErrors([]); }}>[ VERWERFEN ]</button>
        <button className="btn" onClick={() => setList([...list, newTrigger(list.length + 1)])}>[ + TRIGGER ]</button>
        <label className="btn">
          [ MEDIEN HOCHLADEN ]
          <input type="file" multiple accept="image/*,video/mp4,video/webm,audio/*" hidden onChange={e => { upload(e.target.files).catch(() => setNote("Upload fehlgeschlagen")); e.target.value = ""; }} />
        </label>
        <span className={dirty ? "" : "muted"} role="status">{dirty ? "● ungespeicherte Änderungen" : note}</span>
      </section>
      {errors.length > 0 && <ul className="editor-errors" role="alert">{errors.map(e => <li key={e}>{e}</li>)}</ul>}

      <datalist id="media-image">{media.filter(m => IMAGE.test(m)).map(m => <option key={m} value={m} />)}</datalist>
      <datalist id="media-video">{media.filter(m => VIDEO.test(m)).map(m => <option key={m} value={m} />)}</datalist>
      <datalist id="media-audio">{media.filter(m => AUDIO.test(m)).map(m => <option key={m} value={m} />)}</datalist>

      {list.length === 0 && <p className="muted">Noch keine Trigger. [ + TRIGGER ] legt einen an.</p>}
      {list.map((t, i) => (
        <TriggerCard
          key={i}
          t={t}
          dirty={dirty}
          onChange={x => set(i, x)}
          onCopy={() => setList([...list.slice(0, i + 1), { ...structuredClone(t), name: `${t.name}-kopie` }, ...list.slice(i + 1)])}
          onDelete={() => confirm(`Trigger "${t.name}" löschen?`) && setList(list.filter((_, k) => k !== i))}
        />
      ))}
    </main>
  );
}

function TriggerCard({ t, dirty, onChange, onCopy, onDelete }: {
  t: Trigger; dirty: boolean; onChange: (t: Trigger) => void; onCopy: () => void; onDelete: () => void;
}) {
  const who = t.who ?? ["everyone"];
  // "alle" schliesst die anderen Rollen aus und umgekehrt
  const toggleRole = (r: string) => {
    const rest = who.filter(w => w !== r && (r === "everyone" ? false : w !== "everyone"));
    const next = who.includes(r) ? rest : [...rest, r];
    onChange({ ...t, who: next.length ? next : ["everyone"] });
  };
  const setAction = (k: number, a: FxAction) => onChange({ ...t, do: t.do.map((x, j) => (j === k ? a : x)) });
  const move = (k: number, by: number) => {
    const next = [...t.do];
    [next[k], next[k + by]] = [next[k + by], next[k]];
    onChange({ ...t, do: next });
  };

  return (
    <section className={`trigger-card${t.enabled === false ? " disabled" : ""}`}>
      <div className="row">
        <label className="grow">Name <input value={t.name} onChange={e => onChange({ ...t, name: e.target.value })} /></label>
        <label className="check"><input type="checkbox" checked={t.enabled !== false} onChange={e => onChange({ ...t, enabled: e.target.checked })} /> aktiv</label>
        <button className="btn" disabled={dirty} title={dirty ? "Erst speichern" : "Effekt jetzt auslösen"}
          onClick={() => fetch(`/api/trigger?name=${encodeURIComponent(t.name)}`, { method: "POST" })}>[ TEST ]</button>
        <button className="btn" onClick={onCopy}>[ KOPIE ]</button>
        <button className="btn" onClick={onDelete}>[ LÖSCHEN ]</button>
      </div>

      <div className="row">
        <label>Wann
          <select value={t.when.type} onChange={e => onChange({ ...t, when: { ...t.when, type: e.target.value as When["type"] } })}>
            {WHEN.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
          </select>
        </label>
        <label className="grow">Text im Chat <input value={t.when.match} placeholder="z.B. LIZARD oder !lizard" onChange={e => onChange({ ...t, when: { ...t.when, match: e.target.value } })} /></label>
        <label className="check"><input type="checkbox" checked={Boolean(t.when.caseSensitive)} onChange={e => onChange({ ...t, when: { ...t.when, caseSensitive: e.target.checked } })} /> Gross/klein beachten</label>
      </div>

      <div className="row">
        <fieldset>
          <legend>Wer</legend>
          {ROLES.map(r => (
            <label key={r.value} className="check"><input type="checkbox" checked={who.includes(r.value)} onChange={() => toggleRole(r.value)} /> {r.label}</label>
          ))}
        </fieldset>
        <Num label="Abklingzeit (s)" value={t.cooldown} onChange={v => onChange({ ...t, cooldown: v })} />
        <Num label="pro Zuschauer (s)" value={t.userCooldown} onChange={v => onChange({ ...t, userCooldown: v })} />
      </div>

      <h3 className="muted">AKTIONEN (nacheinander)</h3>
      {t.do.map((a, k) => (
        <ActionRow
          key={k}
          a={a}
          first={k === 0}
          onChange={x => setAction(k, x)}
          onUp={k > 0 ? () => move(k, -1) : undefined}
          onDown={k < t.do.length - 1 ? () => move(k, 1) : undefined}
          onRemove={t.do.length > 1 ? () => onChange({ ...t, do: t.do.filter((_, j) => j !== k) }) : undefined}
        />
      ))}
      <button className="btn" onClick={() => onChange({ ...t, do: [...t.do, newAction()] })}>[ + AKTION ]</button>
    </section>
  );
}

function ActionRow({ a, first, onChange, onUp, onDown, onRemove }: {
  a: FxAction; first: boolean; onChange: (a: FxAction) => void; onUp?: () => void; onDown?: () => void; onRemove?: () => void;
}) {
  const set = (patch: Partial<FxAction>) => {
    const next: Record<string, unknown> = { ...a, ...patch };
    // Leere Felder weglassen, damit die JSON-Datei übersichtlich bleibt
    for (const k of Object.keys(next)) if (next[k] === "" || next[k] === undefined) delete next[k];
    onChange(next as FxAction);
  };
  const pos = a.position ?? "center";
  const custom = typeof pos === "object";

  return (
    <div className="action-row">
      <div className="row">
        <label>Art
          <select value={a.type} onChange={e => set({ type: e.target.value as FxAction["type"] })}>
            <option value="media">Medium</option>
            <option value="text">Text</option>
          </select>
        </label>
        {a.type === "media" && <>
          <label className="grow">Bild/GIF <input list="media-image" value={a.image ?? ""} onChange={e => set({ image: e.target.value })} /></label>
          <label className="grow">Video <input list="media-video" value={a.video ?? ""} onChange={e => set({ video: e.target.value })} /></label>
        </>}
        <label className="grow">Text {a.type === "media" && "(optional)"}<input value={a.text ?? ""} placeholder="{user}, {message}" onChange={e => set({ text: e.target.value })} /></label>
        <label className="grow">Sound <input list="media-audio" value={a.sound ?? ""} onChange={e => set({ sound: e.target.value })} /></label>
      </div>
      <div className="row">
        <Num label="Warten davor (s)" value={a.delay} onChange={v => set({ delay: v })} />
        <Num label="Dauer (s)" value={a.duration} placeholder="4" onChange={v => set({ duration: v })} />
        <Num label="Stehen danach (s)" value={a.after} onChange={v => set({ after: v })} />
        <Num label="Breite (px)" value={a.size} placeholder="360" step={10} onChange={v => set({ size: v })} />
        <Num label="Lautstärke 0-1" value={a.volume} step={0.1} placeholder="1" onChange={v => set({ volume: v })} />
        <label>Zone <input value={a.zone ?? ""} placeholder="main" size={6} onChange={e => set({ zone: e.target.value })} /></label>
        <label>Position
          <select value={custom ? "custom" : pos} onChange={e => set({ position: e.target.value === "custom" ? { x: 50, y: 50 } : (e.target.value as "center" | "random") })}>
            <option value="center">Mitte</option>
            <option value="random">zufällig</option>
            <option value="custom">fest (x/y %)</option>
          </select>
        </label>
        {custom && <>
          <Num label="x %" value={pos.x} step={1} onChange={v => set({ position: { x: v ?? 50, y: pos.y } })} />
          <Num label="y %" value={pos.y} step={1} onChange={v => set({ position: { x: pos.x, y: v ?? 50 } })} />
        </>}
        {!first && <label className="check"><input type="checkbox" checked={Boolean(a.together)} onChange={e => set({ together: e.target.checked || undefined })} /> gleichzeitig mit vorheriger</label>}
        <span className="row-end">
          <button className="btn" disabled={!onUp} onClick={onUp} aria-label="Aktion nach oben">[ ▲ ]</button>
          <button className="btn" disabled={!onDown} onClick={onDown} aria-label="Aktion nach unten">[ ▼ ]</button>
          <button className="btn" disabled={!onRemove} onClick={onRemove} aria-label="Aktion entfernen">[ ✕ ]</button>
        </span>
      </div>
    </div>
  );
}

// Zahlenfeld: leer = Standardwert (Feld wird weggelassen)
function Num({ label, value, onChange, step = 0.5, placeholder }: {
  label: string; value?: number; onChange: (v: number | undefined) => void; step?: number; placeholder?: string;
}) {
  return (
    <label>{label}
      <input type="number" min={0} step={step} value={value ?? ""} placeholder={placeholder}
        onChange={e => onChange(e.target.value === "" ? undefined : Number(e.target.value))} />
    </label>
  );
}
