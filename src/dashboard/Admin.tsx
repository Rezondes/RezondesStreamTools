// Admin section in the dashboard (admins only, the server checks it itself): edit and save the registration mode,
// allowlist, beta testers and the level of every feature (off, beta testers only, everyone); plus all profiles with
// access, Twitch connection, EventSub status and last login, and the server-wide backups.
import { useCallback, useEffect, useState } from "react";
import type { AccessPolicy as Access } from "../generated/AccessPolicy.ts";
import type { Feature } from "../generated/Feature.ts";
import type { FeatureLevel as Level } from "../generated/FeatureLevel.ts";
import { isErrorCode, type ErrorCode } from "../core/errorCodes.ts";
import { accessLosses, hasLosses } from "./accessChanges.ts";
import { createBackup, deleteBackup, deleteStreamer, getJson, postJson, restoreBackup, toggleStreamerLive, uploadBackup } from "./api.ts";
import { reportError, toast } from "./notices.ts";
import { Segmented } from "./PanelFields.tsx";
import { SubTabs, subTabPanel } from "./SubTabs.tsx";
import { TEXTS } from "./texts.de.ts";

const ADMIN_TEXT = TEXTS.adminArea;
const TABS = (["access", "features", "streamers", "backups"] as const).map(id => ({ id, label: ADMIN_TEXT.tabs[id] }));
type Tab = (typeof TABS)[number]["id"];
const FEATURES = Object.keys(ADMIN_TEXT.featureNames) as Feature[];
const LEVELS = Object.keys(ADMIN_TEXT.levels) as Level[];

// Answer of GET /api/admin/streamers
type StreamerRow = { login: string; allowed: boolean; admin: boolean; connected: boolean; live: boolean; streamLive: boolean; lastLogin: number | null };

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
  // Only a failed load stays on the page; results of actions come as toast or error dialog
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<Tab>("access");

  const load = useCallback(() => {
    getJson<Access | null>("/api/admin/access", null).then(loaded => {
      if (!loaded) return setFailed(true);
      setSaved(loaded);
      setAccess(toDraft(loaded));
    }).catch(() => setFailed(true));
    getJson<StreamerRow[]>("/api/admin/streamers", []).then(setStreamers).catch((failure: unknown) => reportError(TEXTS.errors["server-error"], { Aktion: "GET /api/admin/streamers", Grund: String(failure) }));
  }, []);
  useEffect(load, [load]);

  if (!access) return <p className="muted">{failed ? TEXTS.errors["server-error"] : TEXTS.loading}</p>;

  const save = () => {
    const next = fromDraft(access);
    if (saved && !confirmLosses(saved, next)) return;
    postJson("/api/admin/access", next)
      .then(result => {
        if (result.ok) {
          toast(ADMIN_TEXT.saved);
          return load();
        }
        reportError(TEXTS.errors[typeof result.data === "string" && isErrorCode(result.data) ? result.data : "server-error"], { Aktion: "POST /api/admin/access", Antwort: JSON.stringify(result.data) });
      })
      .catch((failure: unknown) => reportError(TEXTS.errors["server-error"], { Aktion: "POST /api/admin/access", Grund: String(failure) }));
  };

  // Access and features are one setting on the server: both tabs show the same save bar
  const saveBar = <SaveBar dirty={saved !== null && JSON.stringify(fromDraft(access)) !== JSON.stringify(saved)} onSave={save} />;

  return (
    <section className="panel admin">
      <SubTabs label={ADMIN_TEXT.tabsLabel} tabs={TABS} current={tab} onChange={setTab} />
      <div className="section-area" {...subTabPanel(tab)}>
        {tab === "access" && <section className="settings-group section-card"><AccessLists access={access} onChange={setAccess} />{saveBar}</section>}
        {tab === "features" && <section className="settings-group section-card"><FeatureTable access={access} onChange={setAccess} />{saveBar}</section>}
        {tab === "streamers" && (
          <section className="settings-group section-card">
            <StreamerTable streamers={streamers} onChanged={load} />
          </section>
        )}
        {tab === "backups" && (
          <div className="section-cards">
            <section className="settings-group section-card"><h2>{ADMIN_TEXT.backups}</h2><Backups /></section>
            <section className="settings-group section-card"><h2>{ADMIN_TEXT.schedule}</h2><BackupScheduleForm /></section>
          </div>
        )}
      </div>
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

// Save with its state: unsaved changes or all saved
function SaveBar({ dirty, onSave }: { dirty: boolean; onSave: () => void }) {
  return (
    <div className="actions">
      <button className="btn primary" disabled={!dirty} onClick={onSave}>{ADMIN_TEXT.save}</button>
      <span role="status" className="muted">{dirty ? ADMIN_TEXT.unsaved : ADMIN_TEXT.clean}</span>
    </div>
  );
}

// Who may log in: the mode as two buttons, the two lists side by side where there is room
function AccessLists({ access, onChange }: { access: AccessDraft; onChange: (access: AccessDraft) => void }) {
  const modes = (Object.keys(ADMIN_TEXT.registrationModes) as Access["registration"][]).map(mode => ({ value: mode, label: ADMIN_TEXT.registrationModes[mode] }));
  return (
    <>
      <Segmented label={ADMIN_TEXT.registration} value={access.registration} options={modes} onChange={registration => onChange({ ...access, registration })} />
      <div className="admin-lists">
        <label className="setting">
          {ADMIN_TEXT.allowlist}
          <textarea rows={8} value={access.allowlist} spellCheck={false} onChange={event => onChange({ ...access, allowlist: event.target.value })} />
        </label>
        <label className="setting">
          {ADMIN_TEXT.beta}
          <textarea rows={8} value={access.beta} spellCheck={false} onChange={event => onChange({ ...access, beta: event.target.value })} />
        </label>
      </div>
    </>
  );
}

// Every feature one row, its level as one of three radio buttons, so all levels are visible at once
function FeatureTable({ access, onChange }: { access: AccessDraft; onChange: (access: AccessDraft) => void }) {
  return (
    <table className="admin-features">
      <thead><tr><th>{ADMIN_TEXT.feature}</th>{LEVELS.map(level => <th key={level}>{ADMIN_TEXT.levels[level]}</th>)}</tr></thead>
      <tbody>
        {FEATURES.map(feature => (
          <tr key={feature}>
            <td>{ADMIN_TEXT.featureNames[feature]}</td>
            {LEVELS.map(level => (
              <td key={level}>
                <input type="radio" name={`feature-${feature}`} checked={access.features[feature] === level} aria-label={`${ADMIN_TEXT.featureNames[feature]}: ${ADMIN_TEXT.levels[level]}`}
                  onChange={() => onChange({ ...access, features: { ...access.features, [feature]: level } })} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// An action on one profile: the done text as a toast, an error as the error dialog; the list loads again either way
function actOnStreamer(action: Promise<ErrorCode | null>, done: string, details: Record<string, string>, onChanged: () => void) {
  action.then(code => {
    if (code) reportError(TEXTS.errors[code], { ...details, Code: code });
    else toast(done);
    onChanged();
  }).catch((failure: unknown) => reportError(TEXTS.errors["server-error"], { ...details, Grund: String(failure) }));
}

// One row per profile; the name opens the Twitch channel, the actions sit together on the right
function StreamerTable({ streamers, onChanged }: { streamers: StreamerRow[]; onChanged: () => void }) {
  const yesNo = (value: boolean) => (value ? ADMIN_TEXT.yes : ADMIN_TEXT.no);
  const onToggleLive = (row: StreamerRow) => {
    const done = row.streamLive ? ADMIN_TEXT.markedOffline(row.login) : ADMIN_TEXT.markedLive(row.login);
    actOnStreamer(toggleStreamerLive(row.login), done, { Aktion: "Livestatus umschalten", Login: row.login }, onChanged);
  };
  const onDelete = (login: string) => {
    if (confirm(ADMIN_TEXT.confirmDeleteStreamer(login))) actOnStreamer(deleteStreamer(login), ADMIN_TEXT.streamerDeleted(login), { Aktion: "Profil löschen", Login: login }, onChanged);
  };
  return (
    <table>
      <thead>
        <tr>
          <th>{ADMIN_TEXT.login}</th><th>{ADMIN_TEXT.allowed}</th><th>{ADMIN_TEXT.connected}</th><th>{ADMIN_TEXT.live}</th>
          <th>{ADMIN_TEXT.streamLive}</th><th>{ADMIN_TEXT.lastLogin}</th><th>{ADMIN_TEXT.actions}</th>
        </tr>
      </thead>
      <tbody>
        {streamers.map(row => (
          <tr key={row.login}>
            <td>
              <a href={`https://www.twitch.tv/${encodeURIComponent(row.login)}`} target="_blank" rel="noopener noreferrer" aria-label={ADMIN_TEXT.openTwitch(row.login)}>{row.login}</a>
              {row.admin && <span className="muted"> {ADMIN_TEXT.adminMark}</span>}
            </td>
            <td className={row.allowed ? "" : "muted"}>{yesNo(row.allowed)}</td>
            <td className={row.connected ? "" : "muted"}>{yesNo(row.connected)}</td>
            <td className={row.live ? "glow" : "muted"}>{yesNo(row.live)}</td>
            <td className={row.streamLive ? "glow" : "muted"}>{yesNo(row.streamLive)}</td>
            <td>{row.lastLogin ? new Date(row.lastLogin).toLocaleString("de-DE") : ADMIN_TEXT.never}</td>
            <td>
              <button className="btn" onClick={() => onToggleLive(row)}>{row.streamLive ? ADMIN_TEXT.markOffline : ADMIN_TEXT.markLive}</button>
              {!row.admin && <>{" "}<button className="btn danger" onClick={() => onDelete(row.login)}>{ADMIN_TEXT.deleteStreamer}</button></>}
            </td>
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

  // An action on the backups: the done text as a toast, an error as the error dialog
  const act = (action: Promise<ErrorCode | null>, done: string, what: string) => {
    action.then(code => {
      if (code) reportError(TEXTS.errors[code], { Aktion: what, Code: code });
      else toast(done);
      load();
    }).catch((failure: unknown) => reportError(TEXTS.errors["server-error"], { Aktion: what, Grund: String(failure) }));
  };
  const upload = (file: File | undefined) => {
    if (file) act(uploadBackup(file), ADMIN_TEXT.backupUploaded, `Backup hochladen (${file.name}, ${file.size} Bytes)`);
  };
  const restore = (backup: BackupRow) => {
    if (!confirm(ADMIN_TEXT.backupConfirmRestore(time(backup.createdAt)))) return;
    const what = `Backup wiederherstellen (${backup.id})`;
    restoreBackup(backup.id).then(result => {
      if (typeof result === "string") return reportError(TEXTS.errors[result], { Aktion: what, Code: result });
      toast(ADMIN_TEXT.backupRestored(result.restored, result.skipped.length));
      load();
    }).catch((failure: unknown) => reportError(TEXTS.errors["server-error"], { Aktion: what, Grund: String(failure) }));
  };
  const remove = (backup: BackupRow) => {
    if (confirm(ADMIN_TEXT.backupConfirmDelete(time(backup.createdAt)))) act(deleteBackup(backup.id), ADMIN_TEXT.backupDeleted, `Backup löschen (${backup.id})`);
  };

  return (
    <>
      <p className="muted">{ADMIN_TEXT.backupHint}</p>
      <div className="actions">
        <button className="btn primary" disabled={listing.running} onClick={() => act(createBackup(), ADMIN_TEXT.backupStarted, "Backup erstellen")}>{ADMIN_TEXT.backupCreate}</button>
        <label className="btn">
          {ADMIN_TEXT.backupUpload}
          <input type="file" accept=".zip,application/zip" hidden onChange={event => upload(event.target.files?.[0])} />
        </label>
        {listing.running && <span role="status" className="muted">{ADMIN_TEXT.backupRunning}</span>}
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
  useEffect(() => {
    getJson<BackupSchedule | null>("/api/admin/backup-settings", null).then(setSchedule).catch(() => setSchedule(null));
  }, []);
  if (schedule === undefined) return <p className="muted">{TEXTS.loading}</p>;
  if (schedule === null) return <p className="muted">{ADMIN_TEXT.backupUnavailable}</p>;

  const number = (value: string) => Math.trunc(Number(value));
  const save = () => {
    postJson("/api/admin/backup-settings", schedule)
      .then(result => {
        if (result.ok) return toast(ADMIN_TEXT.scheduleSaved);
        reportError(TEXTS.errors[typeof result.data === "string" && isErrorCode(result.data) ? result.data : "server-error"], { Aktion: "POST /api/admin/backup-settings", Antwort: JSON.stringify(result.data) });
      })
      .catch((failure: unknown) => reportError(TEXTS.errors["server-error"], { Aktion: "POST /api/admin/backup-settings", Grund: String(failure) }));
  };
  return (
    <>
      <p className="muted">{ADMIN_TEXT.scheduleHint}</p>
      <label className="setting-row">
        <input type="checkbox" checked={schedule.enabled} onChange={event => setSchedule({ ...schedule, enabled: event.target.checked })} /> {ADMIN_TEXT.scheduleEnabled}
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
      </div>
    </>
  );
}
