// Chat of the standard theme: messages as rounded cards below each other, new ones at the bottom, optionally with badges and
// fading. A new card glides in with a light spring (GSAP), fading out after chatFade blurs it a little (CSS).
// Messages (useChat) and their content with emotes (MessageParts) come from the core, here the look.
import { useRef } from "react";
import MessageParts from "../../../core/chat/MessageParts.tsx";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import type { ChatMessage } from "../../../core/types.ts";
import { useChat } from "../../../core/hooks/useChat.ts";
import { useStandard } from "../useStandard.ts";

// fixed: where a new card comes from (px below, scale) and how long it glides in s
const ENTER = { y: 24, scale: 0.96, duration: 0.5 };

export default function Chat() {
  const values = useStandard();
  const messages = useChat(values.chatMax);
  return <div className="standard-chat">{messages.map(message => <Row key={message.id} message={message} />)}</div>;
}

function Row({ message }: { message: ChatMessage }) {
  const values = useStandard();
  const row = useRef<HTMLDivElement>(null);
  useTimeline(timeline => {
    timeline.from(row.current, { y: ENTER.y, opacity: 0, scale: ENTER.scale, duration: ENTER.duration, ease: "back.out(1.4)" });
  }, [], row);
  return (
    <div ref={row} className={`standard-card standard-row${values.chatFade > 0 ? " fades" : ""}`}>
      {values.chatBadges && message.badges.map(badge => <span key={badge} className="standard-chip">{badge}</span>)}
      <b className="standard-user">{message.user}</b>
      <MessageParts parts={message.parts} emoteClassName="standard-emote" />
    </div>
  );
}
