// Effects overlay of the KOTH theme for the chat triggers (/s/<login>/fx), transparent. Zone, defaults, sequence,
// position and text come from the effects context of the core (src/core/fx), the media are shown by core/FxMedia.tsx; here
// the text is on a radio slip (can be switched off) that drops in with GSAP (PLAN-KOTH.md package 4), fade-in and fade-out
// from the settings.
// Parameters: ?zone=main, ?sound=0, ?volume=0.5
import { useRef } from "react";
import FxMedia from "../../../core/FxMedia.tsx";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import { useFxItem, useFxScene } from "../../../core/fx/useFxScene.ts";
import type { ShownFx } from "../../../core/hooks/useFx.ts";
import { useKoth } from "../useKoth.ts";

export default function Fx() {
  const shown = useFxScene(useKoth());
  return <div className="kh-fx">{shown.map(item => <Item key={item.id} item={item} />)}</div>;
}

// fixed: how the slip drops in (px, deg, s, ease)
const SLIP = { y: -80, turn: -8, length: 0.55, ease: "back.out(2)" };

function Item({ item }: { item: ShownFx }) {
  const values = useKoth();
  const { phase, text, style } = useFxItem(item);
  const scope = useRef<HTMLDivElement>(null);
  useTimeline(timeline => {
    const slip = scope.current?.querySelector(".kh-fx-text.slip");
    if (slip) timeline.from(slip, { opacity: 0, y: SLIP.y, rotate: SLIP.turn, duration: SLIP.length, ease: SLIP.ease });
  }, [text, values.fxBubble], scope);
  return (
    <div ref={scope} className={`kh-fx-item in-${values.fxIn} out-${values.fxOut}`} style={style}>
      <FxMedia item={item} phase={phase} />
      {text && <div className={`kh-fx-text${values.fxBubble ? " slip" : ""}`}>{text}</div>}
    </div>
  );
}
