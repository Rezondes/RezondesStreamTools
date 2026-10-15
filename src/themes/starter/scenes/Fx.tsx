// Effekt-Overlay des Starter-Themes für die Chat-Trigger (/s/<login>/fx), transparent. Medien zeigt core/FxMedia.tsx,
// der Text steht in einer abgerundeten Karte. Standardwerte aus den Einstellungen gelten, wenn eine Aktion sie nicht
// selbst angibt. Parameter: ?zone=main, ?sound=0, ?volume=0.5
import { useMemo } from "react";
import FxMedia from "../../../core/FxMedia.tsx";
import { params } from "../../../core/params.ts";
import { fillTemplate } from "../../../core/template.ts";
import { fxLifetime } from "../../../core/overlayTiming.ts";
import { useFx, useFxPhase, type ShownFx } from "../../../core/hooks/useFx.ts";
import { useStarter } from "../useStarter.ts";

const ZONE = params.get("zone") ?? "main";

export default function Fx() {
  const values = useStarter();
  const defaults = useMemo(() => ({ duration: values.fxDuration, size: values.fxSize }), [values.fxDuration, values.fxSize]);
  const shown = useFx(ZONE, values.fxMax, defaults, values.fxMargin);
  return <div className="starter-fx">{shown.map(item => <Item key={item.id} item={item} />)}</div>;
}

function Item({ item }: { item: ShownFx }) {
  const action = item.action;
  const phase = useFxPhase(action);
  const text = fillTemplate(action.text ?? "", { user: item.user, message: item.message });
  return (
    <div className="starter-fx-item" style={{ left: `${item.x}%`, top: `${item.y}%`, width: action.size, "--life": `${fxLifetime(action)}ms` } as React.CSSProperties}>
      <FxMedia item={item} phase={phase} />
      {text && <div className="starter-card starter-fx-text">{text}</div>}
    </div>
  );
}
