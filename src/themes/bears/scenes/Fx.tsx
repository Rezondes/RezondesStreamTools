// Effects overlay of the Bärenbande theme for the chat triggers (/s/<login>/fx), transparent. Zone, defaults, sequence,
// position and text come from the effects context of the core (src/core/fx), the media are shown by core/FxMedia.tsx;
// here the chosen bear holds the text on a sign or says it in a speech bubble, fade-in and fade-out from the settings.
// Parameters: ?zone=main, ?sound=0, ?volume=0.5
import FxMedia from "../../../core/FxMedia.tsx";
import { useFxItem, useFxScene } from "../../../core/fx/useFxScene.ts";
import type { ShownFx } from "../../../core/hooks/useFx.ts";
import Bear from "../Bear.tsx";
import { isBearChoice, TOWER } from "../bears.ts";
import { useBears } from "../useBears.ts";

export default function Fx() {
  const values = useBears();
  const shown = useFxScene(values);
  return <div className={`bb-fx bb-facing-${values.facing}`}>{shown.map(item => <Item key={item.id} item={item} />)}</div>;
}

function Item({ item }: { item: ShownFx }) {
  const values = useBears();
  const { phase, text, style } = useFxItem(item);
  const bear = isBearChoice(values.bearFx) && values.bearFx !== TOWER ? values.bearFx : "grizzly";
  return (
    <div className={`bb-fx-item in-${values.fxIn} out-${values.fxOut}`} style={style}>
      <FxMedia item={item} phase={phase} />
      {text && values.fxStyle === "schild" && <div className="bb-fx-bear"><Bear bear={bear} pose="sign" sign={text} className="bb-hero" /></div>}
      {text && values.fxStyle === "blase" && (
        <div className="bb-fx-talk">
          <div className="bb-fx-text bb-card">{text}</div>
          <div className="bb-fx-bear"><Bear bear={bear} pose="wave" className="bb-hero" /></div>
        </div>
      )}
    </div>
  );
}
