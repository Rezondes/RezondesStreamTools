// Help command on the overview with a link to the public commands page: on/off, command, template of the chat reply and cooldown (commands.json in the
// profile, GET/POST /api/commands). The server checks the values; invalid ones stay unsaved.
import { useEffect, useState } from "react";
import type { HelpConfig } from "../core/commands.ts";
import * as streamerPath from "../core/streamerPath.ts";
import { getJson, postJson } from "./api.ts";
import { TEXTS } from "./texts.de.ts";

const TEXT = TEXTS.help;
// canChat from the server: may the Twitch login write (false = login from before the help command, reconnect)
type HelpState = HelpConfig & { canChat?: boolean | null };

export default function ChatHelp({ login }: { login: string }) {
  const page = `${location.origin}${streamerPath.base(login)}/`;
  const [help, setHelp] = useState<HelpState | null>(null);
  const [status, setStatus] = useState<"saved" | "invalid" | null>(null);
  useEffect(() => { getJson<HelpState | null>("/api/commands", null).then(setHelp).catch(() => {}); }, []);
  if (!help) return null;
  const change = (patch: Partial<HelpState>) => { setHelp({ ...help, ...patch }); setStatus(null); };
  const save = () => {
    postJson("/api/commands", help)
      .then(result => {
        if (result.ok) setHelp({ ...(result.data as HelpConfig), canChat: help.canChat });
        setStatus(result.ok ? "saved" : "invalid");
      })
      .catch(() => setStatus("invalid"));
  };
  return (
    <>
      <h2>{TEXT.title}</h2>
      <p className="muted">{TEXT.intro}</p>
      <p className="actions">
        <span>{TEXT.page}</span>
        <a href={page} target="_blank" rel="noreferrer"><code>{page}</code></a>
        <span className="muted">{TEXT.pageHint}</span>
      </p>
      {help.canChat === false && (
        <p className="actions">
          <span className="error" role="alert">{TEXT.reconnect}</span>
          <a className="btn" href="/auth/login">{TEXTS.connections.twitchReconnect}</a>
        </p>
      )}
      <label className="setting-row"><input type="checkbox" checked={help.enabled} onChange={event => change({ enabled: event.target.checked })} /> {TEXT.enabled}</label>
      <div className="actions">
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
