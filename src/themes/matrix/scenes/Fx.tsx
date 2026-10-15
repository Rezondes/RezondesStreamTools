// Effekt-Overlay für die Chat-Trigger des Streamers (/s/<login>/fx), transparent. Empfohlen 1920x1080.
// Parameter: ?zone=main (nur Aktionen mit dieser zone), ?sound=0, ?volume=0.5
// Braucht den Overlay-Server, denn dort laufen die Trigger. Standarddauer, -grösse, Rand und Animationen
// aus den Einstellungen gelten, wenn eine Aktion sie nicht selbst angibt.
//
// Ablauf pro Effekt: erscheint und steht angehalten (delay), spielt ab samt Ton (duration),
// bleibt angehalten auf dem letzten Bild stehen (after) und verschwindet dann. Die Medien zeigt core/FxMedia.tsx.
import { useMemo } from "react";
import FxMedia from "../../../core/FxMedia.tsx";
import { params } from "../../../core/params.ts";
import { fillTemplate } from "../../../core/template.ts";
import { fxLifetime } from "../../../core/overlayTiming.ts";
import { useFx, useFxPhase, type ShownFx } from "../../../core/hooks/useFx.ts";
import { useMatrix } from "../useMatrix.ts";

const ZONE = params.get("zone") ?? "main";

export default function Fx() {
  const values = useMatrix();
  const defaults = useMemo(() => ({ duration: values.fxDuration, size: values.fxSize }), [values.fxDuration, values.fxSize]);
  const shown = useFx(ZONE, values.fxMax, defaults, values.fxMargin);
  return <div className="fx">{shown.map(item => <Item key={item.id} item={item} />)}</div>;
}

function Item({ item }: { item: ShownFx }) {
  const values = useMatrix();
  const action = item.action;
  const phase = useFxPhase(action);
  const text = fillTemplate(action.text ?? "", { user: item.user, message: item.message });
  return (
    <div
      className={`fx-item in-${values.fxIn} out-${values.fxOut}`}
      style={{ left: `${item.x}%`, top: `${item.y}%`, width: action.size, "--life": `${fxLifetime(action)}ms` } as React.CSSProperties}
    >
      <FxMedia item={item} phase={phase} />
      {text && <div className="fx-text glow glitch" data-text={text}>{text}</div>}
    </div>
  );
}
