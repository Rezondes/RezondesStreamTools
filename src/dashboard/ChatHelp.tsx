// Hilfe-Befehl auf der Übersicht: an/aus, Befehl, Vorlage der Chat-Antwort und Abklingzeit (commands.json im
// Profil, GET/POST /api/commands). Der Server prüft die Werte; ungültige bleiben ungespeichert.
import { useEffect, useState } from "react";
import type { HelpConfig } from "../core/commands.ts";
import { getJson, postJson } from "./api.ts";
import { TEXTS } from "./texts.de.ts";

const TEXT = TEXTS.help;

export default function ChatHelp() {
  const [help, setHelp] = useState<HelpConfig | null>(null);
  const [status, setStatus] = useState<"saved" | "invalid" | null>(null);
  useEffect(() => { getJson<HelpConfig | null>("/api/commands", null).then(setHelp).catch(() => {}); }, []);
  if (!help) return null;
  const change = (patch: Partial<HelpConfig>) => { setHelp({ ...help, ...patch }); setStatus(null); };
  const save = () => {
    postJson("/api/commands", help)
      .then(result => {
        if (result.ok) setHelp(result.data as HelpConfig);
        setStatus(result.ok ? "saved" : "invalid");
      })
      .catch(() => setStatus("invalid"));
  };
  return (
    <>
      <h2>{TEXT.title}</h2>
      <p className="muted">{TEXT.intro}</p>
      <div className="actions">
        <label className="setting-row"><input type="checkbox" checked={help.enabled} onChange={event => change({ enabled: event.target.checked })} /> {TEXT.enabled}</label>
        <label className="setting">{TEXT.command} <input value={help.command} maxLength={25} onChange={event => change({ command: event.target.value })} /></label>
        <label className="setting">{TEXT.cooldown} <input type="number" min={0} max={3600} value={help.cooldown} onChange={event => change({ cooldown: Number(event.target.value) })} /></label>
      </div>
      <label className="setting">
        {TEXT.reply}
        <textarea rows={2} maxLength={400} value={help.reply} onChange={event => change({ reply: event.target.value })} />
      </label>
      <p className="muted">{TEXT.replyHint}</p>
      <p className="actions">
        <button className="btn primary" onClick={save}>{TEXT.save}</button>
        {status === "saved" && <span className="glow" role="status">{TEXT.saved}</span>}
        {status === "invalid" && <span className="error" role="alert">{TEXT.invalid}</span>}
      </p>
    </>
  );
}
