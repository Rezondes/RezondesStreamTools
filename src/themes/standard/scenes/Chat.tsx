// Chat of the standard theme: messages as rounded cards below each other, new ones at the bottom, optionally with badges and
// fading. Messages (useChat) and their content with emotes (MessageParts) come from the core, here the look.
import MessageParts from "../../../core/chat/MessageParts.tsx";
import type { ChatMessage } from "../../../core/types.ts";
import { useChat } from "../../../core/hooks/useChat.ts";
import { useStandard } from "../useStandard.ts";

export default function Chat() {
  const values = useStandard();
  const messages = useChat(values.chatMax);
  return <div className="standard-chat">{messages.map(message => <Row key={message.id} message={message} />)}</div>;
}

function Row({ message }: { message: ChatMessage }) {
  const values = useStandard();
  return (
    <div className={`standard-card standard-row${values.chatFade > 0 ? " fades" : ""}`}>
      {values.chatBadges && message.badges.map(badge => <span key={badge} className="standard-chip">{badge}</span>)}
      <b className="standard-user">{message.user}</b>
      <MessageParts parts={message.parts} emoteClassName="standard-emote" />
    </div>
  );
}
