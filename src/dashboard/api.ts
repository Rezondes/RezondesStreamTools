// Requests of the dashboard to the server: load the account (/api/me) and actions via POST.
// post returns null on success, otherwise the error code from the response (texts in texts.de.ts).
import type { MediaOverview as MediaList } from "../generated/MediaOverview.ts";
import { isErrorCode, type ErrorCode } from "../core/errorCodes.ts";
import type { Me } from "./navigation.ts";

export type { MediaList };

// undefined = loading; offline = no server reachable; anonymous = not logged in; not-allowed = not enabled
export type Account = Me | "offline" | "anonymous" | "not-allowed" | undefined;

export async function loadAccount(): Promise<Account> {
  try {
    const response = await fetch("/api/me");
    if (response.status === 401) return "anonymous";
    if (response.status === 403) return "not-allowed";
    return response.ok ? ((await response.json()) as Me) : "offline";
  } catch {
    // Network error: no overlay server reachable (e.g. npm run dev without server)
    return "offline";
  }
}

export const post = (url: string) => request(url, { method: "POST" });

// Media: list with sizes and use, upload (storage limit), delete
export const loadMedia = () => getJson<MediaList>("/api/media", { files: [], usedBytes: 0, limitBytes: 0 });
export const uploadMedia = (file: File) => request(`/api/media?name=${encodeURIComponent(file.name)}`, { method: "POST", body: file });
export const deleteMedia = (name: string) => request(`/api/media?name=${encodeURIComponent(name)}`, { method: "DELETE" });

// Backups (admins, new server only): start one in the background, delete one
export const createBackup = () => request("/api/admin/backups", { method: "POST" });
export const deleteBackup = (id: string) => request(`/api/admin/backup?id=${encodeURIComponent(id)}`, { method: "DELETE" });
export const deleteStreamer = (login: string) => request(`/api/admin/streamer?login=${encodeURIComponent(login)}`, { method: "DELETE" });
export const toggleStreamerLive = (login: string) => request(`/api/admin/streamer/live?login=${encodeURIComponent(login)}`, { method: "POST" });
export const uploadBackup = (file: File) => request("/api/admin/backups/upload", { method: "POST", body: file });

// Restore: the answer names how many profiles came back and which were left out (deleted, no key)
type RestoreReport = { restored: number; skipped: string[] };
export async function restoreBackup(id: string): Promise<RestoreReport | ErrorCode> {
  try {
    const response = await fetch(`/api/admin/backup/restore?id=${encodeURIComponent(id)}`, { method: "POST" });
    if (response.ok) return (await response.json()) as RestoreReport;
    const code = (await response.text()).trim();
    return isErrorCode(code) ? code : "server-error";
  } catch {
    return "server-error";
  }
}

// Request without response data: null on success, otherwise the error code from the response
async function request(url: string, init: RequestInit): Promise<ErrorCode | null> {
  try {
    const response = await fetch(url, init);
    if (response.ok) return null;
    const code = (await response.text()).trim();
    return isErrorCode(code) ? code : "server-error";
  } catch {
    return "server-error";
  }
}

// JSON via POST: ok and the answer, otherwise ok = false and the error body (list { key, code } or a code)
export async function postJson(url: string, body: unknown): Promise<{ ok: boolean; data: unknown }> {
  try {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const text = await response.text();
    return { ok: response.ok, data: parseBody(text) };
  } catch {
    return { ok: false, data: "server-error" };
  }
}

// JSON answer or an error code as text
function parseBody(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text.trim();
  }
}

// JSON from url, fallback on errors
export async function getJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(url);
    return response.ok ? ((await response.json()) as T) : fallback;
  } catch {
    return fallback;
  }
}
