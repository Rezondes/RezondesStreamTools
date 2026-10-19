// Chat of the Bärenbande theme: the chosen bear holds a big phone and the messages appear as speech bubbles on its
// screen, or paper notes on a string, or plain speech bubbles without a bear; new ones at the bottom (or top), badges as
// small pills, optional fading. Messages (useChat), badge texts (badgeLabel) and content with emotes (MessageParts) come
// from the core, here the look.
import { badgeLabel } from "../../../core/chat/chat.ts";
import MessageParts from "../../../core/chat/MessageParts.tsx";
import { useChat } from "../../../core/hooks/useChat.ts";
import type { ChatMessage } from "../../../core/types.ts";
import Bear from "../Bear.tsx";
import { isBearChoice, TOWER } from "../bears.ts";
import { useBears } from "../useBears.ts";

export default function Chat() {
  const values = useBears();
  const messages = useChat(values.chatMax);
  const rows = (
    <div className={`bb-chat-list bb-chat-${values.chatAlign}`}>
      {messages.map(message => <Row key={message.id} message={message} />)}
    </div>
  );
  if (values.chatStyle !== "handy") return <div className={`bb-chat bb-chat-style-${values.chatStyle}`}>{rows}</div>;
  const bear = isBearChoice(values.bearChat) && values.bearChat !== TOWER ? values.bearChat : "panda";
  return (
    <div className={`bb-chat bb-chat-style-handy bb-facing-${values.facing} ${values.blinkEvery > 0 ? "bb-blinking" : ""}`}>
      <div className="bb-chat-bear"><Bear bear={bear} pose="cheer" className="bb-hero" /></div>
      <div className="bb-phone">{rows}</div>
    </div>
  );
}

function Row({ message }: { message: ChatMessage }) {
  const values = useBears();
  return (
    <div className={`bb-row${values.chatFade > 0 ? " fades" : ""}${message.action ? " action" : ""}`}>
      <span className="bb-msg">
        {values.chatBadges && message.badges.map(badge => <span key={badge} className="bb-badge">{badgeLabel(badge, values)}</span>)}
        <b className="bb-user">{message.user}</b>
        <MessageParts parts={message.parts} emoteClassName="bb-emote" />
      </span>
    </div>
  );
}
