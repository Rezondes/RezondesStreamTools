// Chat of the Urlaub theme: messages as rising bubbles, wooden planks or shells, new ones at the bottom (or
// top), badges as small signs, optional gentle swaying and fading; air bubbles rise behind them (PixiJS). Messages (useChat), badge texts
// (badgeLabel) and content with emotes (MessageParts) come from the core, here the beach look.
import type { Application } from "pixi.js";
import { Graphics } from "pixi.js";
import { useRef } from "react";
import { badgeLabel } from "../../../core/chat/chat.ts";
import MessageParts from "../../../core/chat/MessageParts.tsx";
import { useChat } from "../../../core/hooks/useChat.ts";
import { useViewport } from "../../../core/hooks/useViewport.ts";
import PixiStage from "../../../core/pixi/PixiStage.tsx";
import type { ChatMessage } from "../../../core/types.ts";
import { drawBubbles } from "../pixi/Bubbles.tsx";
import type { UrlaubValues } from "../settings.ts";
import { useUrlaub } from "../useUrlaub.ts";

export default function Chat() {
  const values = useUrlaub();
  const messages = useChat(values.chatMax);
  return (
    <div className={`ul-chat ul-chat-${values.chatStyle} ul-chat-${values.chatAlign}${values.chatSway ? " sway" : ""}`}>
      {values.chatBubbles && values.chatBubbleCount > 0 && <Bubbles values={values} />}
      {messages.map(message => <Row key={message.id} message={message} />)}
    </div>
  );
}

function Row({ message }: { message: ChatMessage }) {
  const values = useUrlaub();
  return (
    <div className={`ul-row${values.chatFade > 0 ? " fades" : ""}${message.action ? " action" : ""}`}>
      <span className="ul-msg">
        {values.chatBadges && message.badges.map(badge => <span key={badge} className="ul-badge">{badgeLabel(badge, values)}</span>)}
        <b className="ul-user">{message.user}</b>
        <MessageParts parts={message.parts} emoteClassName="ul-emote" />
      </span>
    </div>
  );
}

const SECOND_MS = 1000; // fixed: seconds in ms
// The air bubbles behind the messages, in the size of the source (a resized source gets a new area); the settings are
// read every frame
function Bubbles({ values }: { values: UrlaubValues }) {
  const latest = useRef(values);
  latest.current = values;
  const area = useViewport();
  const draw = (app: Application) => {
    const bubbles = app.stage.addChild(new Graphics());
    let seconds = 0;
    const paint = () => {
      seconds += app.ticker.deltaMS / SECOND_MS;
      drawBubbles(bubbles, seconds, latest.current.chatBubbleCount, area, latest.current.chatBubbleRise, latest.current.foam);
    };
    app.ticker.add(paint);
    return () => app.ticker.remove(paint);
  };
  return <PixiStage background={null} size={area} onReady={draw} className="ul-bubbles" />;
}
