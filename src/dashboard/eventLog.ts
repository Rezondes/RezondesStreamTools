// Ereignis-Protokoll der Verbindungsseite: macht aus den SSE-Nachrichten des Servers (dieselben wie für die Overlays)
// kurze Sätze. Nur Wichtiges: Alerts, Effekte, Titelwechsel, Minimes beitreten und verlassen; Einstellungen und
// Minime-Reaktionen fallen weg. Reine Funktionen, getestet in eventLog.check.ts.
import type { Alert, Minime, ServerMessage, Track } from "../core/types.ts";
import { TEXTS } from "./texts.de.ts";

export type LogKind = "alert" | "fx" | "music" | "minimes";
export type LogEntry = { id: number; at: number; kind: LogKind; text: string };
// entries: neueste zuerst; minimes und track: letzter Stand, um nur Änderungen zu melden (undefined = noch keiner)
export type LogState = { entries: LogEntry[]; next: number; minimes?: Minime[]; track?: { id: string; playing: boolean } | null };

export const MAX_ENTRIES = 200;
export const EMPTY_LOG: LogState = { entries: [], next: 0 };
const LOG = TEXTS.connections.log;

// Neuer Stand nach einer Nachricht; at = Zeitpunkt in ms
export function logMessage(state: LogState, message: ServerMessage, at: number): LogState {
  switch (message.type) {
    case "alert": return add(state, at, "alert", [alertText(message.alert)]);
    case "fx": return add(state, at, "fx", [LOG.fx(message.event.user) + quote(message.event.message)]);
    case "music": return music(state, message.track, at);
    case "minimes": return minimes(state, message.minimes, at);
    default: return state;
  }
}

function add(state: LogState, at: number, kind: LogKind, texts: string[]): LogState {
  const added = texts.map((text, index) => ({ id: state.next + index, at, kind, text })).reverse();
  return { ...state, entries: [...added, ...state.entries].slice(0, MAX_ENTRIES), next: state.next + texts.length };
}

const quote = (text: string | undefined) => (text ? LOG.quote(text) : "");

function alertText(alert: Alert): string {
  const texts = LOG.alerts;
  const amount = alert.amount ?? 0;
  switch (alert.kind) {
    case "follow": return texts.follow(alert.user);
    case "sub": return texts.sub(alert.user) + quote(alert.text);
    case "resub": return texts.resub(alert.user, amount) + quote(alert.text);
    case "gift": return texts.gift(alert.user, amount);
    case "raid": return texts.raid(alert.user, amount);
    case "cheer": return texts.cheer(alert.user, amount) + quote(alert.text);
    case "redeem": return texts.redeem(alert.user, alert.detail ?? "") + quote(alert.text);
    case "hype": return alert.detail === "begin" ? texts.hypeBegin : alert.detail === "end" ? texts.hypeEnd(amount) : texts.hypeLevel(amount);
  }
}

// Nur Titelwechsel, Pause und Stopp; Spulen im selben Titel und Stille beim Verbinden zählen nicht
function music(state: LogState, track: Track | null, at: number): LogState {
  const before = state.track;
  const next = track ? { id: track.id, playing: track.playing } : null;
  const same = before === undefined ? next === null : before?.id === next?.id && before?.playing === next?.playing;
  if (same) return { ...state, track: next };
  const text = track ? (track.playing ? LOG.playing : LOG.paused)(track.title, track.artist) : LOG.stopped;
  return { ...add(state, at, "music", [text]), track: next };
}

// Erste Liste = Stand beim Verbinden (nur gezählt), danach wer beigetreten ist und wer gegangen ist
function minimes(state: LogState, list: Minime[], at: number): LogState {
  const before = state.minimes;
  if (!before) return { ...(list.length > 0 ? add(state, at, "minimes", [LOG.minimesNow(list.length)]) : state), minimes: list };
  const had = new Set(before.map(minime => minime.login));
  const has = new Set(list.map(minime => minime.login));
  const texts = [
    ...list.filter(minime => !had.has(minime.login)).map(minime => LOG.joined(minime.user)),
    ...before.filter(minime => !has.has(minime.login)).map(minime => LOG.left(minime.user)),
  ];
  return { ...add(state, at, "minimes", texts), minimes: list };
}
