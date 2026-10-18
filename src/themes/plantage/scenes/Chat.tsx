// Chat of the Plantage theme: messages as harvest slips, boards nailed to a tree trunk or mango leaves, new ones at the
// bottom (or top), badges as small labels, optional gentle swaying and fading. Messages (useChat), badge texts
// (badgeLabel) and content with emotes (MessageParts) come from the core, here the plantation look.
import { badgeLabel } from "../../../core/chat/chat.ts";
import MessageParts from "../../../core/chat/MessageParts.tsx";
import { useChat } from "../../../core/hooks/useChat.ts";
import type { ChatMessage } from "../../../core/types.ts";
import { usePlantage } from "../usePlantage.ts";

export default function Chat() {
  const values = usePlantage();
  const messages = useChat(values.chatMax);
  return (
    <div className={`pl-chat pl-chat-${values.chatStyle} pl-chat-${values.chatAlign}${values.chatSway ? " sway" : ""}`}>
      {messages.map(message => <Row key={message.id} message={message} />)}
    </div>
  );
}

function Row({ message }: { message: ChatMessage }) {
  const values = usePlantage();
  return (
    <div className={`pl-row${values.chatFade > 0 ? " fades" : ""}${message.action ? " action" : ""}`}>
      <span className="pl-msg">
        {values.chatBadges && message.badges.map(badge => <span key={badge} className="pl-badge">{badgeLabel(badge, values)}</span>)}
        <b className="pl-user">{message.user}</b>
        <MessageParts parts={message.parts} emoteClassName="pl-emote" />
      </span>
    </div>
  );
}
