// Effects overlay of the Dachdecker theme for the chat triggers (/s/<login>/fx), transparent. Zone, defaults, sequence,
// position and text come from the effects context of the core, the media are shown by core/FxMedia.tsx; here an optional
// text in the style of the screen titles. Parameters: ?zone=main, ?sound=0, ?volume=0.5
import FxMedia from "../../../core/FxMedia.tsx";
import { useFxItem, useFxScene } from "../../../core/fx/useFxScene.ts";
import type { ShownFx } from "../../../core/hooks/useFx.ts";
import { useDachdecker } from "../useDachdecker.ts";

export default function Fx() {
  const shown = useFxScene(useDachdecker());
  return <div className="dd-fx">{shown.map(item => <Item key={item.id} item={item} />)}</div>;
}

function Item({ item }: { item: ShownFx }) {
  const values = useDachdecker();
  const { phase, text, style } = useFxItem(item);
  return (
    <div className="dd-fx-item" style={style}>
      <FxMedia item={item} phase={phase} />
      {values.fxText && text && <b className="dd-fx-text">{text}</b>}
    </div>
  );
}
