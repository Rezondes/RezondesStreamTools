// Chat of the Kebab theme (DESIGN-KEBAB.md "Chat"): messages as small order notes with a zigzag edge that come out
// like from a printer (or a list on paper, or plain lines), the name in the red for text or, per chatter, in one of the
// theme colors; the text in dark brown; old ones fade after their lifetime. Messages, badges and emotes come from the
// core.
import { badgeLabel } from "../../../core/chat/chat.ts";
import MessageParts from "../../../core/chat/MessageParts.tsx";
import { hash, seedOf } from "../../../core/hash.ts";
import { useChat } from "../../../core/hooks/useChat.ts";
import type { ChatMessage } from "../../../core/types.ts";
import { useKebab } from "../useKebab.ts";

// Name tones per chatter (classes in overlays.css): every chatter keeps one
const TONES = ["redText", "brown", "muted"] as const;

export default function Chat() {
  const values = useKebab();
  const messages = useChat(values.chatMax);
  return <div className={`kb-chat kb-chat-${values.chatStyle}`}>{messages.map(message => <Row key={message.id} message={message} />)}</div>;
}

function Row({ message }: { message: ChatMessage }) {
  const values = useKebab();
  const tone = values.chatNameColor === "chatter" ? TONES[Math.floor(hash(seedOf(message.login)) * TONES.length)] : TONES[0];
  const classes = `kb-chat-row${values.chatLifetime > 0 ? " fades" : ""}${message.action ? " action" : ""}`;
  return (
    <div className={classes}>
      <span className={`kb-chat-name kb-tone-${tone}`}>
        {values.chatBadges && message.badges.map(badge => <span key={badge} className="kb-badge">{badgeLabel(badge, values)}</span>)}
        {message.user}
      </span>
      <span className="kb-chat-text"><MessageParts parts={message.parts} emoteClassName="kb-emote" /></span>
      {values.chatStyle === "zettel" && <i className="kb-zigzag" aria-hidden="true" />}
    </div>
  );
}
