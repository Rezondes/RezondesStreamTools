// Effects overlay for the streamer's chat triggers (/s/<login>/fx), transparent. Recommended 1920x1080.
// Parameters: ?zone=main (only actions with this zone), ?sound=0, ?volume=0.5
// Needs the overlay server, because the triggers run there. Zone, defaults, sequence (paused, running, standing on
// the last frame), position and text come from the effects context of the core (src/core/fx), the media are shown by
// core/FxMedia.tsx; here only the matrix look with glitch text and animations from the settings. The text types itself
// like a terminal output and glitches as it appears (fxType).
import { useRef } from "react";
import FxMedia from "../../../core/FxMedia.tsx";
import { useFxItem, useFxScene } from "../../../core/fx/useFxScene.ts";
import type { ShownFx } from "../../../core/hooks/useFx.ts";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import { typeIn } from "../crtMotion.ts";
import { useMatrix } from "../useMatrix.ts";

export default function Fx() {
  const shown = useFxScene(useMatrix());
  return <div className="fx">{shown.map(item => <Item key={item.id} item={item} />)}</div>;
}

function Item({ item }: { item: ShownFx }) {
  const values = useMatrix();
  const { phase, text, style } = useFxItem(item);
  const scope = useRef<HTMLDivElement>(null);
  useTimeline(timeline => {
    const line = scope.current?.querySelector(".fx-text");
    if (line && values.fxType) typeIn(timeline, line, 0, values.decodeSpeed);
  }, [text, values.fxType, values.decodeSpeed], scope);
  return (
    <div ref={scope} className={`fx-item in-${values.fxIn} out-${values.fxOut}`} style={style}>
      <FxMedia item={item} phase={phase} />
      {text && <div className="fx-text glow glitch" data-text={text}>{text}</div>}
    </div>
  );
}
