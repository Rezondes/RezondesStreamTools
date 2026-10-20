// Chat of the Chaos theme: messages as crooked notes with tape, as marker bubbles or plain glowing lines; the name in
// marker, badges on small tape pieces, new ones slap in at the bottom (or top), optional fading. Messages (useChat),
// badge texts (badgeLabel) and content with emotes (MessageParts) come from the core, here the look.
import { badgeLabel } from "../../../core/chat/chat.ts";
import MessageParts from "../../../core/chat/MessageParts.tsx";
import { useChat } from "../../../core/hooks/useChat.ts";
import type { ChatMessage } from "../../../core/types.ts";
import Note, { inkOf } from "../Note.tsx";
import { useChaos } from "../useChaos.ts";

export default function Chat() {
  const values = useChaos();
  const messages = useChat(values.chatMax);
  return (
    <div className={`ch-chat ch-chat-${values.chatStyle} ch-chat-${values.chatAlign}`}>
      {messages.map((message, index) => <Row key={message.id} message={message} ink={inkOf(index)} />)}
    </div>
  );
}

function Row({ message, ink }: { message: ChatMessage; ink: "magenta" | "cyan" }) {
  const values = useChaos();
  const content = (
    <>
      {values.chatBadges && message.badges.map(badge => <span key={badge} className="ch-badge">{badgeLabel(badge, values)}</span>)}
      <b className="ch-user">{message.user}</b>
      <span className="ch-message"><MessageParts parts={message.parts} emoteClassName="ch-emote" /></span>
    </>
  );
  const classes = `ch-row${values.chatFade > 0 ? " fades" : ""}${message.action ? " action" : ""}`;
  if (values.chatStyle === "zettel") return <Note ink={ink} tape className={classes}>{content}</Note>;
  return <div className={`${classes} ch-ink-${ink}`}>{content}</div>;
}
