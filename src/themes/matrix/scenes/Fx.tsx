// Effekt-Overlay für die Chat-Trigger des Streamers (/s/<login>/fx), transparent. Empfohlen 1920x1080.
// Parameter: ?zone=main (nur Aktionen mit dieser zone), ?sound=0, ?volume=0.5
// Braucht den Overlay-Server, denn dort laufen die Trigger. Zone, Standardwerte, Ablauf (angehalten, läuft, steht auf
// dem letzten Bild), Lage und Text kommen aus dem Effekt-Kontext des Kerns (src/core/fx), die Medien zeigt
// core/FxMedia.tsx; hier nur das Matrix-Aussehen mit Glitch-Text und Animationen aus den Einstellungen.
import FxMedia from "../../../core/FxMedia.tsx";
import { useFxItem, useFxScene } from "../../../core/fx/useFxScene.ts";
import type { ShownFx } from "../../../core/hooks/useFx.ts";
import { useMatrix } from "../useMatrix.ts";

export default function Fx() {
  const shown = useFxScene(useMatrix());
  return <div className="fx">{shown.map(item => <Item key={item.id} item={item} />)}</div>;
}

function Item({ item }: { item: ShownFx }) {
  const values = useMatrix();
  const { phase, text, style } = useFxItem(item);
  return (
    <div className={`fx-item in-${values.fxIn} out-${values.fxOut}`} style={style}>
      <FxMedia item={item} phase={phase} />
      {text && <div className="fx-text glow glitch" data-text={text}>{text}</div>}
    </div>
  );
}
