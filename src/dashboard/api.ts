// Anfragen des Dashboards an den Server: Konto laden (/api/me) und Aktionen per POST.
// post liefert null bei Erfolg, sonst den Fehlercode aus der Antwort (Texte in texts.de.ts).
import type { MediaList } from "../../server/media.ts";
import { isErrorCode, type ErrorCode } from "../core/errorCodes.ts";
import type { Me } from "./navigation.ts";

export type { MediaList };

// undefined = lädt; offline = kein Server erreichbar; anonymous = nicht angemeldet; not-allowed = nicht freigeschaltet
export type Account = Me | "offline" | "anonymous" | "not-allowed" | undefined;

export async function loadAccount(): Promise<Account> {
  try {
    const response = await fetch("/api/me");
    if (response.status === 401) return "anonymous";
    if (response.status === 403) return "not-allowed";
    return response.ok ? ((await response.json()) as Me) : "offline";
  } catch {
    // Netzwerkfehler: kein Overlay-Server erreichbar (z.B. npm run dev ohne Server)
    return "offline";
  }
}

export const post = (url: string) => request(url, { method: "POST" });

// Medien: Liste mit Grössen und Nutzung, Hochladen (Speicherlimit), Löschen
export const loadMedia = () => getJson<MediaList>("/api/media", { files: [], usedBytes: 0, limitBytes: 0 });
export const uploadMedia = (file: File) => request(`/api/media?name=${encodeURIComponent(file.name)}`, { method: "POST", body: file });
export const deleteMedia = (name: string) => request(`/api/media?name=${encodeURIComponent(name)}`, { method: "DELETE" });

// Anfrage ohne Antwortdaten: null bei Erfolg, sonst der Fehlercode aus der Antwort
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

// JSON per POST: ok und die Antwort, sonst ok = false und der Fehlerkörper (Liste { key, code } oder ein Code)
export async function postJson(url: string, body: unknown): Promise<{ ok: boolean; data: unknown }> {
  try {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const text = await response.text();
    return { ok: response.ok, data: parseBody(text) };
  } catch {
    return { ok: false, data: "server-error" };
  }
}

// JSON-Antwort oder ein Fehlercode als Text
function parseBody(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text.trim();
  }
}

// JSON von url, bei Fehlern fallback
export async function getJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(url);
    return response.ok ? ((await response.json()) as T) : fallback;
  } catch {
    return fallback;
  }
}
