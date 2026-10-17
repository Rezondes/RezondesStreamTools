// Event log of the connections page: turns the server's SSE messages (the same as for the overlays)
// short sentences. Only what matters: alerts, effects, track changes, minimes joining and leaving; settings and
// minime reactions drop out. Pure functions, tested in eventLog.check.ts.
import type { Alert, Minime, ServerMessage, Track } from "../core/types.ts";
import { TEXTS } from "./texts.de.ts";

export type LogKind = "alert" | "fx" | "music" | "minimes";
type LogEntry = { id: number; at: number; kind: LogKind; text: string };
// entries: newest first; minimes and track: last state, to report only changes (undefined = none yet)
export type LogState = { entries: LogEntry[]; next: number; minimes?: Minime[]; track?: { id: string; playing: boolean } | null };

export const MAX_ENTRIES = 200;
export const EMPTY_LOG: LogState = { entries: [], next: 0 };
const LOG = TEXTS.connections.log;

// New state after a message; at = time in ms
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

// Only track changes, pause and stop; seeking within the same track and silence on connect do not count
function music(state: LogState, track: Track | null, at: number): LogState {
  const before = state.track;
  const next = track ? { id: track.id, playing: track.playing } : null;
  const same = before === undefined ? next === null : before?.id === next?.id && before?.playing === next?.playing;
  if (same) return { ...state, track: next };
  const text = track ? (track.playing ? LOG.playing : LOG.paused)(track.title, track.artist) : LOG.stopped;
  return { ...add(state, at, "music", [text]), track: next };
}

// First list = state on connect (only counted), afterwards who joined and who left
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
