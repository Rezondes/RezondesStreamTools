// Effects overlay of the Plantage theme for the chat triggers (/s/<login>/fx), transparent. Zone, defaults, sequence,
// position and text come from the effects context of the core (src/core/fx), the media are shown by core/FxMedia.tsx; here
// the text is on a harvest slip (can be switched off) that drops and bounces with GSAP (PLAN-PLANTAGE.md package 4),
// fade-in and fade-out from the settings.
// Parameters: ?zone=main, ?sound=0, ?volume=0.5
import { useRef } from "react";
import FxMedia from "../../../core/FxMedia.tsx";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import { useFxItem, useFxScene } from "../../../core/fx/useFxScene.ts";
import type { ShownFx } from "../../../core/hooks/useFx.ts";
import { usePlantage } from "../usePlantage.ts";

export default function Fx() {
  const shown = useFxScene(usePlantage());
  return <div className="pl-fx">{shown.map(item => <Item key={item.id} item={item} />)}</div>;
}

// fixed: how a card drops and bounces (px, deg, s, ease)
const DROP = { fall: -120, turn: -3, length: 1.1, ease: "bounce.out" };

function Item({ item }: { item: ShownFx }) {
  const values = usePlantage();
  const { phase, text, style } = useFxItem(item);
  const scope = useRef<HTMLDivElement>(null);
  useTimeline(timeline => {
    const slip = scope.current?.querySelector(".pl-fx-text.slip");
    if (slip) timeline.from(slip, { opacity: 0, y: DROP.fall, rotate: DROP.turn, duration: DROP.length, ease: DROP.ease });
  }, [text, values.fxBubble], scope);
  return (
    <div ref={scope} className={`pl-fx-item in-${values.fxIn} out-${values.fxOut}`} style={style}>
      <FxMedia item={item} phase={phase} />
      {text && <div className={`pl-fx-text${values.fxBubble ? " slip" : ""}`}>{text}</div>}
    </div>
  );
}
