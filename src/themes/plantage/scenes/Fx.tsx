// Effects overlay of the Plantage theme for the chat triggers (/s/<login>/fx), transparent. Zone, defaults, sequence,
// position and text come from the effects context of the core (src/core/fx), the media are shown by core/FxMedia.tsx; here
// the text is on a harvest slip (can be switched off), fade-in and fade-out from the settings.
// Parameters: ?zone=main, ?sound=0, ?volume=0.5
import FxMedia from "../../../core/FxMedia.tsx";
import { useFxItem, useFxScene } from "../../../core/fx/useFxScene.ts";
import type { ShownFx } from "../../../core/hooks/useFx.ts";
import { usePlantage } from "../usePlantage.ts";

export default function Fx() {
  const shown = useFxScene(usePlantage());
  return <div className="pl-fx">{shown.map(item => <Item key={item.id} item={item} />)}</div>;
}

function Item({ item }: { item: ShownFx }) {
  const values = usePlantage();
  const { phase, text, style } = useFxItem(item);
  return (
    <div className={`pl-fx-item in-${values.fxIn} out-${values.fxOut}`} style={style}>
      <FxMedia item={item} phase={phase} />
      {text && <div className={`pl-fx-text${values.fxBubble ? " slip" : ""}`}>{text}</div>}
    </div>
  );
}
