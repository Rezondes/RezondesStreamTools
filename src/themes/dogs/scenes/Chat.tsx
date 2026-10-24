// Chat of the Dogs theme (DESIGN-DOGS.md "Chat"): messages as pixel signs, left of each one the chatter's dog peeks out
// with head and front paws (breed and coat from the login, lookOf) and barks once when the message comes; or only the
// signs, or plain lines. Old messages fade after their lifetime. Messages, badges and emotes come from the core.
import { useEffect, useMemo, useState } from "react";
import { badgeLabel } from "../../../core/chat/chat.ts";
import MessageParts from "../../../core/chat/MessageParts.tsx";
import { useChat } from "../../../core/hooks/useChat.ts";
import type { ChatMessage } from "../../../core/types.ts";
import { dogCache } from "../dog.ts";
import { lookOf } from "../lookOf.ts";
import { dogLookOf } from "../looks.ts";
import { peekOf } from "../peek.ts";
import { poseAt, type PoseMode } from "../poses.ts";
import type { DogsValues } from "../settings.ts";
import Pixels from "../ui/Pixels.tsx";
import PixelBox from "../ui/PixelBox.tsx";
import { useDogs } from "../useDogs.ts";

// fixed: the dog barks for 0.7 s when its message comes
const BARK_MS = 700;
// fixed: the peeking dog at 0.6 of the world pixel size
const PEEK_SCALE = 0.6;

export default function Chat() {
  const values = useDogs();
  const messages = useChat(values.chatMax);
  return <div className={`dg-chat dg-chat-${values.chatStyle}`}>{messages.map(message => <Row key={message.id} message={message} />)}</div>;
}

function Row({ message }: { message: ChatMessage }) {
  const values = useDogs();
  const content = (
    <>
      <span className="dg-chat-name">
        {values.chatBadges && message.badges.map(badge => <span key={badge} className="dg-chat-badge">{badgeLabel(badge, values)}</span>)}
        {message.user}
      </span>
      <span className="dg-chat-text"><MessageParts parts={message.parts} emoteClassName="dg-emote" /></span>
    </>
  );
  return (
    <div className={`dg-chat-row${values.chatLifetime > 0 ? " fades" : ""}${message.action ? " action" : ""}`}>
      {values.chatStyle === "hund" && <ChatDog login={message.login} values={values} />}
      {values.chatStyle === "schlicht" ? <div className="dg-chat-line">{content}</div> : <PixelBox className="dg-chat-sign">{content}</PixelBox>}
    </div>
  );
}

function ChatDog({ login, values }: { login: string; values: DogsValues }) {
  const [barking, setBarking] = useState(values.quality !== "niedrig");
  const { breed, coat } = lookOf(login, values);
  const peeks = useMemo(() => {
    const cache = dogCache(dogLookOf(values, breed, coat));
    const peek = (mode: PoseMode) => peekOf(cache.pose(poseAt({ time: 0, mode, fps: values.walkFps, wagSpeed: 0, blinkEvery: 0, pant: values.pant })), breed);
    return { stand: peek("stand"), bark: peek("bark") };
  }, [values, breed, coat]);
  useEffect(() => {
    const stop = setTimeout(() => setBarking(false), BARK_MS);
    return () => clearTimeout(stop);
  }, []);
  return <Pixels image={barking ? peeks.bark : peeks.stand} className="dg-chat-dog" pixelScale={values.pixelScale * PEEK_SCALE} />;
}
