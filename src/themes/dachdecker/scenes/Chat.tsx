// Chat of the Dachdecker theme (DESIGN-DACHDECKER.md "Chat"): messages as small blueprint notes (or a list, or plain
// lines), the name in copper or in the tone of the chatter over a short dimension line, the text in white; new ones
// open like the sign, old ones fade after their lifetime. Messages, badges and emotes come from the core.
import { badgeLabel } from "../../../core/chat/chat.ts";
import MessageParts from "../../../core/chat/MessageParts.tsx";
import { useChat } from "../../../core/hooks/useChat.ts";
import type { ChatMessage } from "../../../core/types.ts";
import { toneOf } from "../alerts.ts";
import { useDachdecker } from "../useDachdecker.ts";

// Name tones when names take the chatter's tone (classes in overlays.css)
const TONES = ["copper", "accent", "rain", "line"] as const;

export default function Chat() {
  const values = useDachdecker();
  const messages = useChat(values.chatMax);
  return <div className={`dd-chat dd-chat-${values.chatStyle}`}>{messages.map(message => <Row key={message.id} message={message} />)}</div>;
}

function Row({ message }: { message: ChatMessage }) {
  const values = useDachdecker();
  const tone = values.chatNameColor === "chatter" ? TONES[toneOf(message.login, TONES.length)] : TONES[0];
  const classes = `dd-chat-row${values.chatStyle === "zettel" ? " dd-sheet dd-no-corners" : ""}${values.chatLifetime > 0 ? " fades" : ""}${message.action ? " action" : ""}`;
  return (
    <div className={classes}>
      <span className={`dd-chat-name dd-tone-${tone}`}>
        {values.chatBadges && message.badges.map(badge => <span key={badge} className="dd-badge">{badgeLabel(badge, values)}</span>)}
        {message.user}
      </span>
      {values.chatDim && <i className="dd-chat-dim" aria-hidden="true" />}
      <span className="dd-chat-text"><MessageParts parts={message.parts} emoteClassName="dd-emote" /></span>
    </div>
  );
}
