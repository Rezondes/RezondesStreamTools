// The paper medallion of the Plantage alert with its ring (wood, paper or woven, after the alert style); the mango lands
// on it (pixi/AlertBurst.tsx). Without the falling mango it shows the symbol of the alert kind. Styles in theme.css.
import { ICONS, type IconName } from "../field.ts";
import ShapeIcon from "../ShapeIcon.tsx";

export default function Medallion({ ring, icon }: { ring: string; icon: IconName | null }) {
  return <div className={`pl-medal pl-medal-${ring}`}>{icon && <ShapeIcon shape={ICONS[icon]} />}</div>;
}
