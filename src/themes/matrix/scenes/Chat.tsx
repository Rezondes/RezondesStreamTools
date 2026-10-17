// Chat overlay, transparent, new messages at the bottom (or top). Recommended e.g. 500x900.
// Prompt, badges, sizes, fading and animations come from the settings. Messages (useChat), badge texts
// (badgeLabel) and content with emotes (MessageParts) come from the core, here the matrix look. Parameters: ?demo
import { badgeLabel } from "../../../core/chat/chat.ts";
import MessageParts from "../../../core/chat/MessageParts.tsx";
import type { ChatMessage } from "../../../core/types.ts";
import { useChat } from "../../../core/hooks/useChat.ts";
import { useMatrixDecode } from "../useMatrixDecode.ts";
import { useMatrix } from "../useMatrix.ts";

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
  return (
    <div className={`msg in-${values.chatIn} out-${values.chatOut}${values.chatFade > 0 ? " fades" : ""}${message.action ? " action" : ""}`}>
      <div className="msg-head">
        {message.badges.map(badge => <span key={badge} className="badge">{badgeLabel(badge, values)}</span>)}
        <span className="glow">{user}</span>
        <span className="muted">{values.chatPrompt}</span>
      </div>
      <div className="msg-body">
        <MessageParts parts={message.parts} emoteClassName="emote" />
      </div>
    </div>
  );
}
