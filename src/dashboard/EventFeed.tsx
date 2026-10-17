// Event log on the connections page: listens live to /s/<login>/events?log (the same messages as the
// overlays, but does not count as an overlay) and shows them as short sentences with time, filterable by kind. The texts
// come from eventLog.ts. After a disconnect (e.g. 404 while the runtime is not running) a new attempt after 10 s.
import { useEffect, useState } from "react";
import * as streamerPath from "../core/streamerPath.ts";
import type { ServerMessage } from "../core/types.ts";
import { EMPTY_LOG, logMessage, type LogKind } from "./eventLog.ts";
import { TEXTS } from "./texts.de.ts";

const RETRY_MS = 10_000;
const KINDS: readonly LogKind[] = ["alert", "fx", "music", "minimes"];
const time = (at: number) => new Date(at).toLocaleTimeString("de-DE");

export default function EventFeed({ login }: { login: string }) {
  const texts = TEXTS.connections.log;
  const { log, open, clear } = useEventLog(login);
  const [hidden, setHidden] = useState<ReadonlySet<LogKind>>(new Set());
  const toggle = (kind: LogKind) => setHidden(before => {
    const next = new Set(before);
    if (!next.delete(kind)) next.add(kind);
    return next;
  });
  const entries = log.entries.filter(entry => !hidden.has(entry.kind));
  return (
    <>
      <h2>{texts.title}</h2>
      <p className="muted">{texts.hint}</p>
      <div className="actions">
        <span className={open ? "glow" : "muted"} role="status">{open ? texts.connected : texts.connecting}</span>
        {KINDS.map(kind => (
          <label key={kind} className="setting-row">
            <input type="checkbox" checked={!hidden.has(kind)} onChange={() => toggle(kind)} />
            {texts.kinds[kind]}
          </label>
        ))}
        <button className="btn" disabled={log.entries.length === 0} onClick={clear}>{texts.clear}</button>
      </div>
      <ol className="event-log" aria-live="polite">
        {entries.length === 0 && <li className="muted">{texts.empty}</li>}
        {entries.map(entry => (
          <li key={entry.id}>
            <span className="muted">{time(entry.at)}</span> <span className="event-kind">{texts.kinds[entry.kind]}</span> {entry.text}
          </li>
        ))}
      </ol>
    </>
  );
}

// Connection to the event stream; open = connected right now. clear only empties the list, the last state stays
function useEventLog(login: string) {
  const [log, setLog] = useState(EMPTY_LOG);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let source: EventSource;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const connect = () => {
      source = new EventSource(`${streamerPath.base(login)}/events?log`);
      source.onopen = () => setOpen(true);
      source.onmessage = event => {
        const message = JSON.parse(String(event.data)) as ServerMessage;
        setLog(before => logMessage(before, message, Date.now()));
      };
      source.onerror = () => {
        setOpen(false);
        if (source.readyState === EventSource.CLOSED) retry = setTimeout(connect, RETRY_MS);
      };
    };
    connect();
    return () => { clearTimeout(retry); source.close(); };
  }, [login]);
  return { log, open, clear: () => setLog(before => ({ ...before, entries: [] })) };
}
