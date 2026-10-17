// Admin section in the dashboard (admins only, the server checks it itself): edit and save the registration mode,
// allowlist, beta testers and the level of every feature (off, beta testers only, everyone); plus all profiles with
// access, Twitch connection, EventSub status and last login, and the server-wide backups.
import { useCallback, useEffect, useState } from "react";
import type { Access, Feature, Level } from "../../server/access.ts";
import { isErrorCode, type ErrorCode } from "../core/errorCodes.ts";
import { accessLosses, hasLosses } from "./accessChanges.ts";
import { createBackup, deleteBackup, deleteStreamer, getJson, postJson, restoreBackup, uploadBackup } from "./api.ts";
import { TEXTS } from "./texts.de.ts";

const ADMIN_TEXT = TEXTS.adminArea;
const FEATURES = Object.keys(ADMIN_TEXT.featureNames) as Feature[];
const LEVELS = Object.keys(ADMIN_TEXT.levels) as Level[];

// Answer of GET /api/admin/streamers
type StreamerRow = { login: string; allowed: boolean; admin: boolean; connected: boolean; live: boolean; lastLogin: number | null };

// GET and POST /api/admin/backup-settings
type BackupSchedule = { enabled: boolean; intervalHours: number; keep: number };

// Answer of GET /api/admin/backups
type BackupRow = { id: string; createdAt: number; bytes: number; automatic: boolean };
type BackupListing = { running: boolean; backups: BackupRow[] };

// How often the list is asked again while a backup is being written
const BACKUP_POLL_MS = 2000;
const MEGABYTE = 1024 * 1024;
const time = (ms: number) => new Date(ms).toLocaleString("de-DE");

// The form holds the lists as text (one login per line), so new lines are possible while typing
type AccessDraft = Omit<Access, "allowlist" | "beta"> & { allowlist: string; beta: string };
const lines = (text: string) => text.split("\n").map(line => line.trim()).filter(Boolean);
const toDraft = (access: Access): AccessDraft => ({ ...access, allowlist: access.allowlist.join("\n"), beta: access.beta.join("\n") });
const fromDraft = (draft: AccessDraft): Access => ({ ...draft, allowlist: lines(draft.allowlist), beta: lines(draft.beta) });

export default function Admin() {
  const [access, setAccess] = useState<AccessDraft | null>(null);
  const [saved, setSaved] = useState<Access | null>(null);
  const [streamers, setStreamers] = useState<StreamerRow[]>([]);
  const [notice, setNotice] = useState<"saved" | ErrorCode | null>(null);

  const load = useCallback(() => {
    getJson<Access | null>("/api/admin/access", null).then(loaded => {
      if (!loaded) return setNotice("server-error");
      setSaved(loaded);
      setAccess(toDraft(loaded));
    }).catch(() => setNotice("server-error"));
    getJson<StreamerRow[]>("/api/admin/streamers", []).then(setStreamers).catch(() => setNotice("server-error"));
  }, []);
  useEffect(load, [load]);

  if (!access) return <p className="muted">{notice && notice !== "saved" ? TEXTS.errors[notice] : TEXTS.loading}</p>;

  const remove = (login: string) => {
    if (!confirm(ADMIN_TEXT.confirmDeleteStreamer(login))) return;
    deleteStreamer(login).then(code => {
      setNotice(code);
      load();
    }).catch(() => setNotice("server-error"));
  };

  const save = () => {
    const next = fromDraft(access);
    if (saved && !confirmLosses(saved, next)) return;
    postJson("/api/admin/access", next)
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
      <StreamerTable streamers={streamers} onDelete={remove} />
      <h2>{ADMIN_TEXT.backups}</h2>
      <Backups />
      <h2>{ADMIN_TEXT.schedule}</h2>
      <BackupScheduleForm />
    </section>
  );
}

// Asks back when streamers lose access or features; true = save
function confirmLosses(saved: Access, next: Access) {
  const losses = accessLosses(saved, next);
  if (!hasLosses(losses)) return true;
  const lines = [
    losses.revoked.length > 0 && ADMIN_TEXT.revoked(losses.revoked.join(", ")),
    losses.betaRemoved.length > 0 && ADMIN_TEXT.betaRemoved(losses.betaRemoved.join(", ")),
    losses.closed && ADMIN_TEXT.closed,
    losses.off.length > 0 && ADMIN_TEXT.off(losses.off.map(feature => ADMIN_TEXT.featureNames[feature]).join(", ")),
  ].filter(Boolean);
  return confirm([ADMIN_TEXT.confirmTitle, ...lines.map(line => `- ${line}`), "", ADMIN_TEXT.confirmEnd].join("\n"));
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

function StreamerTable({ streamers, onDelete }: { streamers: StreamerRow[]; onDelete: (login: string) => void }) {
  const yesNo = (value: boolean) => (value ? ADMIN_TEXT.yes : ADMIN_TEXT.no);
  return (
    <table>
      <thead>
        <tr><th>{ADMIN_TEXT.login}</th><th>{ADMIN_TEXT.allowed}</th><th>{ADMIN_TEXT.connected}</th><th>{ADMIN_TEXT.live}</th><th>{ADMIN_TEXT.lastLogin}</th><th /></tr>
      </thead>
      <tbody>
        {streamers.map(row => (
          <tr key={row.login}>
            <td>{row.login}{row.admin && <span className="muted"> {ADMIN_TEXT.adminMark}</span>}</td>
            <td className={row.allowed ? "" : "muted"}>{yesNo(row.allowed)}</td>
            <td className={row.connected ? "" : "muted"}>{yesNo(row.connected)}</td>
            <td className={row.live ? "glow" : "muted"}>{yesNo(row.live)}</td>
            <td>{row.lastLogin ? new Date(row.lastLogin).toLocaleString("de-DE") : ADMIN_TEXT.never}</td>
            <td>{!row.admin && <button className="btn" onClick={() => onDelete(row.login)}>{ADMIN_TEXT.deleteStreamer}</button>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Backups: create in the background, download, delete, upload and restore; the list is asked again while one is
// being written
function Backups() {
  const [listing, setListing] = useState<BackupListing | null | undefined>(undefined);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const load = useCallback(() => {
    getJson<BackupListing | null>("/api/admin/backups", null).then(setListing).catch(() => setListing(null));
  }, []);
  useEffect(load, [load]);
  useEffect(() => {
    if (!listing?.running) return;
    const timer = setTimeout(load, BACKUP_POLL_MS);
    return () => clearTimeout(timer);
  }, [listing, load]);

  if (listing === undefined) return <p className="muted">{TEXTS.loading}</p>;
  if (listing === null) return <p className="muted">{ADMIN_TEXT.backupUnavailable}</p>;

  const act = (action: Promise<ErrorCode | null>) => {
    setDone(null);
    action.then(code => {
      setError(code);
      load();
    }).catch(() => setError("server-error"));
  };
  const upload = (file: File | undefined) => {
    if (file) act(uploadBackup(file));
  };
  const restore = (backup: BackupRow) => {
    if (!confirm(ADMIN_TEXT.backupConfirmRestore(time(backup.createdAt)))) return;
    setDone(null);
    restoreBackup(backup.id).then(result => {
      if (typeof result === "string") return setError(result);
      setError(null);
      setDone(ADMIN_TEXT.backupRestored(result.restored, result.skipped.length));
      load();
    }).catch(() => setError("server-error"));
  };
  const remove = (backup: BackupRow) => {
    if (confirm(ADMIN_TEXT.backupConfirmDelete(time(backup.createdAt)))) act(deleteBackup(backup.id));
  };

  return (
    <>
      <p className="muted">{ADMIN_TEXT.backupHint}</p>
      <div className="actions">
        <button className="btn primary" disabled={listing.running} onClick={() => act(createBackup())}>{ADMIN_TEXT.backupCreate}</button>
        <label className="btn">
          {ADMIN_TEXT.backupUpload}
          <input type="file" accept=".zip,application/zip" hidden onChange={event => upload(event.target.files?.[0])} />
        </label>
        <span role="status" className={error ? "error" : "muted"}>{error ? TEXTS.errors[error] : listing.running ? ADMIN_TEXT.backupRunning : done ?? ""}</span>
      </div>
      <BackupTable backups={listing.backups} running={listing.running} onRestore={restore} onDelete={remove} />
    </>
  );
}

type BackupTableProps = { backups: BackupRow[]; running: boolean; onRestore: (backup: BackupRow) => void; onDelete: (backup: BackupRow) => void };

function BackupTable({ backups, running, onRestore, onDelete }: BackupTableProps) {
  if (backups.length === 0) return <p className="muted">{ADMIN_TEXT.backupNone}</p>;
  return (
    <table>
      <thead>
        <tr><th>{ADMIN_TEXT.backupTime}</th><th>{ADMIN_TEXT.backupSize}</th><th>{ADMIN_TEXT.backupKind}</th><th /></tr>
      </thead>
      <tbody>
        {backups.map(backup => (
          <tr key={backup.id}>
            <td>{time(backup.createdAt)}</td>
            <td>{(backup.bytes / MEGABYTE).toFixed(1)} MB</td>
            <td>{backup.automatic ? ADMIN_TEXT.backupKinds.automatic : ADMIN_TEXT.backupKinds.manual}</td>
            <td>
              <a className="btn" href={`/api/admin/backup?id=${encodeURIComponent(backup.id)}`} download>{ADMIN_TEXT.backupDownload}</a>{" "}
              <button className="btn" disabled={running} onClick={() => onRestore(backup)}>{ADMIN_TEXT.backupRestore}</button>{" "}
              <button className="btn" onClick={() => onDelete(backup)}>{ADMIN_TEXT.backupDelete}</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Schedule of the automatic backups; the server checks the limits
function BackupScheduleForm() {
  const [schedule, setSchedule] = useState<BackupSchedule | null | undefined>(undefined);
  const [notice, setNotice] = useState<"saved" | ErrorCode | null>(null);
  useEffect(() => {
    getJson<BackupSchedule | null>("/api/admin/backup-settings", null).then(setSchedule).catch(() => setSchedule(null));
  }, []);
  if (schedule === undefined) return <p className="muted">{TEXTS.loading}</p>;
  if (schedule === null) return <p className="muted">{ADMIN_TEXT.backupUnavailable}</p>;

  const number = (value: string) => Math.trunc(Number(value));
  const save = () => {
    postJson("/api/admin/backup-settings", schedule)
      .then(result => setNotice(result.ok ? "saved" : typeof result.data === "string" && isErrorCode(result.data) ? result.data : "server-error"))
      .catch(() => setNotice("server-error"));
  };
  return (
    <>
      <p className="muted">{ADMIN_TEXT.scheduleHint}</p>
      <label className="setting">
        {ADMIN_TEXT.scheduleEnabled}
        <input type="checkbox" checked={schedule.enabled} onChange={event => setSchedule({ ...schedule, enabled: event.target.checked })} />
      </label>
      <label className="setting">
        {ADMIN_TEXT.scheduleInterval}
        <input type="number" min={1} max={720} value={schedule.intervalHours} onChange={event => setSchedule({ ...schedule, intervalHours: number(event.target.value) })} />
      </label>
      <label className="setting">
        {ADMIN_TEXT.scheduleKeep}
        <input type="number" min={1} max={100} value={schedule.keep} onChange={event => setSchedule({ ...schedule, keep: number(event.target.value) })} />
      </label>
      <div className="actions">
        <button className="btn primary" onClick={save}>{ADMIN_TEXT.scheduleSave}</button>
        <span role="status" className={notice === "saved" ? "" : "error"}>{notice === "saved" ? ADMIN_TEXT.scheduleSaved : notice ? TEXTS.errors[notice] : ""}</span>
      </div>
    </>
  );
}
