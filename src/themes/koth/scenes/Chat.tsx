// Chat of the KOTH theme: a radio log, every message a line with time stamp and callsign (the user), as a green radio
// display, typed on paper or plain; new ones at the bottom (or top), badges as small tags, optional fading. Messages
// (useChat), badge texts (badgeLabel) and content with emotes (MessageParts) come from the core, here the military look.
// A new line types itself in with a short static and its time stamp counts up (GSAP, PLAN-KOTH.md package 4).
import { useRef, useState } from "react";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
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

const SECOND_MS = 1000; // fixed: seconds in ms
// fixed: the static over a new line (s, how bright and contrasty), the typing in steps, the digits the time counts through
const STATIC = { length: 0.25, filter: "contrast(2.4) brightness(1.7)" };
const TYPE_STEPS = 10; // fixed: the typing in steps
const DIGITS = "0123456789";

function Row({ message }: { message: ChatMessage }) {
  const values = useKoth();
  const row = useRef<HTMLDivElement>(null);
  // The time stamp is the moment the line appears; kept in state, so later renders do not move it
  const [shownAt] = useState(() => new Date());
  const time = shownAt.toLocaleTimeString(values.locale, { hour: "2-digit", minute: "2-digit" });
  useTimeline(timeline => {
    const line = row.current;
    if (!line) return;
    const typing = values.fadeDuration / SECOND_MS;
    timeline.fromTo(line, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: typing, ease: `steps(${TYPE_STEPS})` }, 0)
      .fromTo(line, { filter: STATIC.filter }, { filter: "none", duration: STATIC.length }, 0);
    const stamp = line.querySelector(".kh-time");
    if (stamp) timeline.from(stamp, { duration: typing, scrambleText: { text: time, chars: DIGITS } }, 0);
  }, [], row);
  return (
    <div ref={row} className={`kh-row${values.chatFade > 0 ? " fades" : ""}${message.action ? " action" : ""}`}>
      {values.chatTime && <span className="kh-time">{time}</span>}
      <span className="kh-msg">
        {values.chatBadges && message.badges.map(badge => <span key={badge} className="kh-badge">{badgeLabel(badge, values)}</span>)}
        <b className="kh-user">{message.user}</b>
        <MessageParts parts={message.parts} emoteClassName="kh-emote" />
      </span>
    </div>
  );
}
