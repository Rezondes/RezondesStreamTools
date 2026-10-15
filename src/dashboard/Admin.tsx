// Admin-Bereich im Dashboard (nur Admins, der Server prüft es selbst): Anmeldemodus, Allowlist, Beta-Tester und die
// Stufe jeder Funktion (aus, nur Beta-Tester, alle) bearbeiten und speichern; dazu alle Profile mit Zugang,
// Twitch-Verbindung, EventSub-Status und letzter Anmeldung.
import { useCallback, useEffect, useState } from "react";
import type { Access, Feature, Level } from "../../server/access.ts";
import { isErrorCode, type ErrorCode } from "../core/errorCodes.ts";
import { getJson, postJson } from "./api.ts";
import { TEXTS } from "./texts.de.ts";

const ADMIN_TEXT = TEXTS.adminArea;
const FEATURES = Object.keys(ADMIN_TEXT.featureNames) as Feature[];
const LEVELS = Object.keys(ADMIN_TEXT.levels) as Level[];

// Antwort von GET /api/admin/streamers
type StreamerRow = { login: string; allowed: boolean; admin: boolean; connected: boolean; live: boolean; lastLogin: number | null };

// Im Formular stehen die Listen als Text (ein Login pro Zeile), damit beim Tippen neue Zeilen möglich sind
type AccessDraft = Omit<Access, "allowlist" | "beta"> & { allowlist: string; beta: string };
const lines = (text: string) => text.split("\n").map(line => line.trim()).filter(Boolean);
const toDraft = (access: Access): AccessDraft => ({ ...access, allowlist: access.allowlist.join("\n"), beta: access.beta.join("\n") });
const fromDraft = (draft: AccessDraft): Access => ({ ...draft, allowlist: lines(draft.allowlist), beta: lines(draft.beta) });

export default function Admin() {
  const [access, setAccess] = useState<AccessDraft | null>(null);
  const [streamers, setStreamers] = useState<StreamerRow[]>([]);
  const [notice, setNotice] = useState<"saved" | ErrorCode | null>(null);

  const load = useCallback(() => {
    getJson<Access | null>("/api/admin/access", null).then(loaded => (loaded ? setAccess(toDraft(loaded)) : setNotice("server-error"))).catch(() => setNotice("server-error"));
    getJson<StreamerRow[]>("/api/admin/streamers", []).then(setStreamers).catch(() => setNotice("server-error"));
  }, []);
  useEffect(load, [load]);

  if (!access) return <p className="muted">{notice && notice !== "saved" ? TEXTS.errors[notice] : TEXTS.loading}</p>;

  const save = () => {
    postJson("/api/admin/access", fromDraft(access))
      .then(result => {
        if (result.ok) {
          setNotice("saved");
          return load();
        }
        setNotice(typeof result.data === "string" && isErrorCode(result.data) ? result.data : "server-error");
      })
      .catch(() => setNotice("server-error"));
  };

  return (
    <section className="panel admin">
      <h2>{ADMIN_TEXT.access}</h2>
      <AccessForm access={access} onChange={setAccess} />
      <div className="actions">
        <button className="btn primary" onClick={save}>{ADMIN_TEXT.save}</button>
        <span role="status" className={notice === "saved" ? "" : "error"}>{notice === "saved" ? ADMIN_TEXT.saved : notice ? TEXTS.errors[notice] : ""}</span>
      </div>
      <h2>{ADMIN_TEXT.streamers}</h2>
      <StreamerTable streamers={streamers} />
    </section>
  );
}

function AccessForm({ access, onChange }: { access: AccessDraft; onChange: (access: AccessDraft) => void }) {
  return (
    <>
      <label className="setting">
        {ADMIN_TEXT.registration}
        <select value={access.registration} onChange={event => onChange({ ...access, registration: event.target.value as Access["registration"] })}>
          <option value="allowlist">{ADMIN_TEXT.registrationModes.allowlist}</option>
          <option value="open">{ADMIN_TEXT.registrationModes.open}</option>
        </select>
      </label>
      <label className="setting">
        {ADMIN_TEXT.allowlist}
        <textarea rows={4} value={access.allowlist} spellCheck={false} onChange={event => onChange({ ...access, allowlist: event.target.value })} />
      </label>
      <label className="setting">
        {ADMIN_TEXT.beta}
        <textarea rows={3} value={access.beta} spellCheck={false} onChange={event => onChange({ ...access, beta: event.target.value })} />
      </label>
      <fieldset className="settings-group">
        <legend>{ADMIN_TEXT.features}</legend>
        {FEATURES.map(feature => (
          <label key={feature} className="setting">
            {ADMIN_TEXT.featureNames[feature]}
            <select value={access.features[feature]} onChange={event => onChange({ ...access, features: { ...access.features, [feature]: event.target.value as Level } })}>
              {LEVELS.map(level => <option key={level} value={level}>{ADMIN_TEXT.levels[level]}</option>)}
            </select>
          </label>
        ))}
      </fieldset>
    </>
  );
}

function StreamerTable({ streamers }: { streamers: StreamerRow[] }) {
  const yesNo = (value: boolean) => (value ? ADMIN_TEXT.yes : ADMIN_TEXT.no);
  return (
    <table>
      <thead>
        <tr><th>{ADMIN_TEXT.login}</th><th>{ADMIN_TEXT.allowed}</th><th>{ADMIN_TEXT.connected}</th><th>{ADMIN_TEXT.live}</th><th>{ADMIN_TEXT.lastLogin}</th></tr>
      </thead>
      <tbody>
        {streamers.map(row => (
          <tr key={row.login}>
            <td>{row.login}{row.admin && <span className="muted"> {ADMIN_TEXT.adminMark}</span>}</td>
            <td className={row.allowed ? "" : "muted"}>{yesNo(row.allowed)}</td>
            <td className={row.connected ? "" : "muted"}>{yesNo(row.connected)}</td>
            <td className={row.live ? "glow" : "muted"}>{yesNo(row.live)}</td>
            <td>{row.lastLogin ? new Date(row.lastLogin).toLocaleString("de-DE") : ADMIN_TEXT.never}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
