// Effekt-Overlay des Südfrucht-Themes für die Chat-Trigger (/s/<login>/fx), transparent. Medien zeigt core/FxMedia.tsx,
// Text steht in einer Sprechblase (abschaltbar). Ein- und Ausblenden aus den Einstellungen. Standardwerte gelten,
// wenn eine Aktion sie nicht selbst angibt. Parameter: ?zone=main, ?sound=0, ?volume=0.5
import { useMemo, type CSSProperties } from "react";
import FxMedia from "../../../core/FxMedia.tsx";
import { useFx, useFxPhase, type ShownFx } from "../../../core/hooks/useFx.ts";
import { fxLifetime } from "../../../core/overlayTiming.ts";
import { params } from "../../../core/params.ts";
import { fillTemplate } from "../../../core/template.ts";
import { useSuedfrucht } from "../useSuedfrucht.ts";

const ZONE = params.get("zone") ?? "main";

export default function Fx() {
  const values = useSuedfrucht();
  const defaults = useMemo(() => ({ duration: values.fxDuration, size: values.fxSize }), [values.fxDuration, values.fxSize]);
  const shown = useFx(ZONE, values.fxMax, defaults, values.fxMargin);
  return <div className="sf-fx">{shown.map(item => <Item key={item.id} item={item} />)}</div>;
}

function Item({ item }: { item: ShownFx }) {
  const values = useSuedfrucht();
  const action = item.action;
  const phase = useFxPhase(action);
  const text = fillTemplate(action.text ?? "", { user: item.user, message: item.message });
  const style = { left: `${item.x}%`, top: `${item.y}%`, width: action.size, "--life": `${fxLifetime(action)}ms` } as CSSProperties;
  return (
    <div className={`sf-fx-item in-${values.fxIn} out-${values.fxOut}`} style={style}>
      <FxMedia item={item} phase={phase} />
      {text && <div className={`sf-fx-text${values.fxBubble ? " bubble" : ""}`}>{text}</div>}
    </div>
  );
}
