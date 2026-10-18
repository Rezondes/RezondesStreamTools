// Chat of the KOTH theme: a radio log, every message a line with time stamp and callsign (the user), as a green radio
// display, typed on paper or plain; new ones at the bottom (or top), badges as small tags, optional fading. Messages
// (useChat), badge texts (badgeLabel) and content with emotes (MessageParts) come from the core, here the military look.
import { useState } from "react";
import { badgeLabel } from "../../../core/chat/chat.ts";
import MessageParts from "../../../core/chat/MessageParts.tsx";
import { useChat } from "../../../core/hooks/useChat.ts";
import type { ChatMessage } from "../../../core/types.ts";
import { useKoth } from "../useKoth.ts";

export default function Chat() {
  const values = useKoth();
  const messages = useChat(values.chatMax);
  return (
    <div className={`kh-chat kh-chat-${values.chatStyle} kh-chat-${values.chatAlign}`}>
      {messages.map(message => <Row key={message.id} message={message} />)}
    </div>
  );
}

function Row({ message }: { message: ChatMessage }) {
  const values = useKoth();
  // The time stamp is the moment the line appears; kept in state, so later renders do not move it
  const [shownAt] = useState(() => new Date());
  const time = shownAt.toLocaleTimeString(values.locale, { hour: "2-digit", minute: "2-digit" });
  return (
    <div className={`kh-row${values.chatFade > 0 ? " fades" : ""}${message.action ? " action" : ""}`}>
      {values.chatTime && <span className="kh-time">{time}</span>}
      <span className="kh-msg">
        {values.chatBadges && message.badges.map(badge => <span key={badge} className="kh-badge">{badgeLabel(badge, values)}</span>)}
        <b className="kh-user">{message.user}</b>
        <MessageParts parts={message.parts} emoteClassName="kh-emote" />
      </span>
    </div>
  );
}
