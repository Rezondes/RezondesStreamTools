// Chat-Overlay, transparent, neue Nachrichten unten (oder oben). Empfohlen z.B. 500x900.
// Prompt, Badges, Grössen, Ausblenden und Animationen kommen aus den Einstellungen. Parameter: ?demo
import type { ChatMessage } from "../../../core/types.ts";
import { useChat } from "../../../core/hooks/useChat.ts";
import { useMatrixDecode } from "../decode.ts";
import { useMatrix } from "../values.ts";

export default function Chat() {
  const values = useMatrix();
  const messages = useChat(values.chatMax);
  return (
    <div className={`chat chat-${values.chatAlign}`}>
      {messages.map(message => <Line key={message.id} message={message} />)}
    </div>
  );
}

function Line({ message }: { message: ChatMessage }) {
  const values = useMatrix();
  const user = useMatrixDecode(message.user, "chatUser");
  // Badges kommen als HOST, MOD, VIP, SUB aus core/ircEvents.ts
  const badges: Record<string, string> = { HOST: values.badgeHost, MOD: values.badgeMod, VIP: values.badgeVip, SUB: values.badgeSub };
  return (
    <div className={`msg in-${values.chatIn} out-${values.chatOut}${values.chatFade > 0 ? " fades" : ""}${message.action ? " action" : ""}`}>
      <div className="msg-head">
        {message.badges.map(badge => <span key={badge} className="badge">{badges[badge] ?? badge}</span>)}
        <span className="glow">{user}</span>
        <span className="muted">{values.chatPrompt}</span>
      </div>
      <div className="msg-body">
        {message.parts.map((part, index) => typeof part === "string"
          ? <span key={index}>{part}</span>
          : <img key={index} className="emote" alt={part.name} src={part.url} />)}
      </div>
    </div>
  );
}
