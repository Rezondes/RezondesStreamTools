// Effects overlay of the Dogs theme for the chat triggers (/s/<login>/fx), transparent. Zone, defaults, sequence,
// position and text come from the effects context of the core, the media are shown by core/FxMedia.tsx; here an
// optional text as a title with the ink outline. Parameters: ?zone=main, ?sound=0, ?volume=0.5
import FxMedia from "../../../core/FxMedia.tsx";
import { useFxItem, useFxScene } from "../../../core/fx/useFxScene.ts";
import type { ShownFx } from "../../../core/hooks/useFx.ts";
import { useDogs } from "../useDogs.ts";

export default function Fx() {
  const shown = useFxScene(useDogs());
  return <div className="dg-fx">{shown.map(item => <Item key={item.id} item={item} />)}</div>;
}

function Item({ item }: { item: ShownFx }) {
  const values = useDogs();
  const { phase, text, style } = useFxItem(item);
  return (
    <div className="dg-fx-item" style={style}>
      <FxMedia item={item} phase={phase} />
      {values.fxText && text && <b className="dg-fx-text">{text}</b>}
    </div>
  );
}
