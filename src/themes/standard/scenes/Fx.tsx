// Effekt-Overlay des Standard-Themes für die Chat-Trigger (/s/<login>/fx), transparent. Zone, Standardwerte, Ablauf,
// Lage und Text kommen aus dem Effekt-Kontext des Kerns (src/core/fx), die Medien zeigt core/FxMedia.tsx; hier steht
// der Text in einer abgerundeten Karte. Parameter: ?zone=main, ?sound=0, ?volume=0.5
import FxMedia from "../../../core/FxMedia.tsx";
import { useFxItem, useFxScene } from "../../../core/fx/useFxScene.ts";
import type { ShownFx } from "../../../core/hooks/useFx.ts";
import { useStandard } from "../useStandard.ts";

export default function Fx() {
  const shown = useFxScene(useStandard());
  return <div className="standard-fx">{shown.map(item => <Item key={item.id} item={item} />)}</div>;
}

function Item({ item }: { item: ShownFx }) {
  const { phase, text, style } = useFxItem(item);
  return (
    <div className="standard-fx-item" style={style}>
      <FxMedia item={item} phase={phase} />
      {text && <div className="standard-card standard-fx-text">{text}</div>}
    </div>
  );
}
