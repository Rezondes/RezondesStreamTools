// Effekt-Overlay des Südfrucht-Themes für die Chat-Trigger (/s/<login>/fx), transparent. Zone, Standardwerte, Ablauf,
// Lage und Text kommen aus dem Effekt-Kontext des Kerns (src/core/fx), die Medien zeigt core/FxMedia.tsx; hier steht
// der Text in einer Sprechblase (abschaltbar), Ein- und Ausblenden aus den Einstellungen.
// Parameter: ?zone=main, ?sound=0, ?volume=0.5
import FxMedia from "../../../core/FxMedia.tsx";
import { useFxItem, useFxScene } from "../../../core/fx/useFxScene.ts";
import type { ShownFx } from "../../../core/hooks/useFx.ts";
import { useSuedfrucht } from "../useSuedfrucht.ts";

export default function Fx() {
  const shown = useFxScene(useSuedfrucht());
  return <div className="sf-fx">{shown.map(item => <Item key={item.id} item={item} />)}</div>;
}

function Item({ item }: { item: ShownFx }) {
  const values = useSuedfrucht();
  const { phase, text, style } = useFxItem(item);
  return (
    <div className={`sf-fx-item in-${values.fxIn} out-${values.fxOut}`} style={style}>
      <FxMedia item={item} phase={phase} />
      {text && <div className={`sf-fx-text${values.fxBubble ? " bubble" : ""}`}>{text}</div>}
    </div>
  );
}
