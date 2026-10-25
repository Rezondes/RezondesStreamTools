// Effects overlay of the standard theme for the chat triggers (/s/<login>/fx), transparent. Zone, defaults, sequence,
// position and text come from the effects context of the core (src/core/fx), the media are shown by core/FxMedia.tsx; here
// the text is in a rounded card. An effect pops in with GSAP and fades out at the end of its life (CSS).
// Parameters: ?zone=main, ?sound=0, ?volume=0.5
import { useRef } from "react";
import FxMedia from "../../../core/FxMedia.tsx";
import { useFxItem, useFxScene } from "../../../core/fx/useFxScene.ts";
import type { ShownFx } from "../../../core/hooks/useFx.ts";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import { useStandard } from "../useStandard.ts";

// fixed: the item is centered on its position (percent of its size)
const CENTER = -50;

export default function Fx() {
  const shown = useFxScene(useStandard());
  return <div className="standard-fx">{shown.map(item => <Item key={item.id} item={item} />)}</div>;
}

function Item({ item }: { item: ShownFx }) {
  const values = useStandard();
  const { phase, text, style } = useFxItem(item);
  const box = useRef<HTMLDivElement>(null);
  useTimeline(timeline => {
    timeline.fromTo(box.current, { xPercent: CENTER, yPercent: CENTER, scale: values.fxFromScale, opacity: 0 }, { scale: 1, opacity: 1, duration: values.fxEnterTime, ease: `back.out(${values.fxOvershoot})` });
  }, [], box);
  return (
    <div ref={box} className="standard-fx-item" style={style}>
      <FxMedia item={item} phase={phase} />
      {text && <div className="standard-card standard-fx-text">{text}</div>}
    </div>
  );
}
