// Chat-Overlay, transparent, neue Nachrichten unten. Empfohlen z.B. 500x900.
// Parameter: ?fade=30 (Sekunden bis Ausblenden, 0 = nie), ?max=30, ?demo
import type { ChatMessage } from "../core/types.ts";
import { numberParam } from "../core/params.ts";
import { useChat } from "../core/hooks/useChat.ts";
import { useDecode } from "../core/hooks/useDecode.ts";

const FADE = numberParam("fade", 30);
const MAX = numberParam("max", 30);

export default function Chat() {
  const messages = useChat(MAX);

  return (
    <div className="chat" style={{ "--fade": `${FADE}s` } as React.CSSProperties}>
      {messages.map(m => <Line key={m.id} m={m} />)}
    </div>
  );
}

function Line({ m }: { m: ChatMessage }) {
  const user = useDecode(m.user, 0, 35);
  return (
    <div className={`msg${FADE > 0 ? " fades" : ""}${m.action ? " action" : ""}`}>
      <div className="msg-head">
        {m.badges.map(b => <span key={b} className="badge">{b}</span>)}
        <span className="glow">{user}</span>
        <span className="muted">@twitch:~$</span>
      </div>
      <div className="msg-body">
        {m.parts.map((p, i) => typeof p === "string"
          ? <span key={i}>{p}</span>
          : <img key={i} className="emote" alt={p.name} src={p.url} />)}
      </div>
    </div>
  );
}
