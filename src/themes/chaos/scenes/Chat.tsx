// Chat of the Chaos theme: messages as crooked notes with tape, as marker bubbles or plain glowing lines; the name in
// marker, badges on small tape pieces, new ones slap in at the bottom (or top), optional fading. Messages (useChat),
// badge texts (badgeLabel) and content with emotes (MessageParts) come from the core, here the look.
import { useRef } from "react";
import { hash, seedOf } from "../../../core/hash.ts";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
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

// fixed: how a new row lands; how big it starts, how far it may be turned (deg) and how long (s) are settings
const SLAP_EASE = "back.out(3)";

function Row({ message, ink }: { message: ChatMessage; ink: "magenta" | "cyan" }) {
  const values = useChaos();
  // A hidden mark inside the row finds the row, also when it is a Note
  const mark = useRef<HTMLElement>(null);
  useTimeline(timeline => {
    const row = mark.current?.closest(".ch-row");
    // fixed: the hash of the id (0 to 1) turned into -1 to 1
    if (row) timeline.from(row, { opacity: 0, scale: values.chatSlapScale, rotate: (hash(seedOf(String(message.id))) - 0.5) * 2 * values.chatSlapTurn, duration: values.chatSlapLength, ease: SLAP_EASE });
  }, []);
  const content = (
    <>
      <i ref={mark} hidden />
      {values.chatBadges && message.badges.map(badge => <span key={badge} className="ch-badge">{badgeLabel(badge, values)}</span>)}
      <b className="ch-user">{message.user}</b>
      <span className="ch-message"><MessageParts parts={message.parts} emoteClassName="ch-emote" /></span>
    </>
  );
  const classes = `ch-row${values.chatFade > 0 ? " fades" : ""}${message.action ? " action" : ""}`;
  if (values.chatStyle === "zettel") return <Note ink={ink} tape className={classes}>{content}</Note>;
  return <div className={`${classes} ch-ink-${ink}`}>{content}</div>;
}
