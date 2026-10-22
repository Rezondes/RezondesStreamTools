// Chat of the Plantage theme: messages as harvest slips, boards nailed to a tree trunk or mango leaves, new ones at the
// bottom (or top), badges as small labels, optional gentle swaying and fading. Messages (useChat), badge texts
// (badgeLabel) and content with emotes (MessageParts) come from the core, here the plantation look. A new slip floats in
// like a leaf and settles (GSAP, PLAN-PLANTAGE.md package 4).
import { useRef } from "react";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
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

// fixed: the way of a leaf: drift sideways and fall (px), the turns on its way (deg), how long (s)
const LEAF = { drift: 30, fall: 70, turns: [-14, 8, -3], length: 1.1 };

function Row({ message }: { message: ChatMessage }) {
  const values = usePlantage();
  const row = useRef<HTMLDivElement>(null);
  useTimeline(timeline => {
    if (!row.current) return;
    timeline.fromTo(row.current, { opacity: 0, x: -LEAF.drift, y: -LEAF.fall, rotate: LEAF.turns[0] }, {
      keyframes: [{ opacity: 1, x: LEAF.drift * 0.6, y: -LEAF.fall * 0.45, rotate: LEAF.turns[1] }, { x: -LEAF.drift * 0.25, y: -LEAF.fall * 0.1, rotate: LEAF.turns[2] }, { x: 0, y: 0, rotate: 0 }],
      duration: LEAF.length, ease: "sine.out",
    });
  }, [], row);
  return (
    <div ref={row} className={`pl-row${values.chatFade > 0 ? " fades" : ""}${message.action ? " action" : ""}`}>
      <span className="pl-msg">
        {values.chatBadges && message.badges.map(badge => <span key={badge} className="pl-badge">{badgeLabel(badge, values)}</span>)}
        <b className="pl-user">{message.user}</b>
        <MessageParts parts={message.parts} emoteClassName="pl-emote" />
      </span>
    </div>
  );
}
