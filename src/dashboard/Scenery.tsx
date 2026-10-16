// Szenerie hinter dem Dashboard im Südfrucht-Skin: Sonne, Palmen links und rechts und ein paar Früchte im Sand, mit
// den Formen und Standardfarben des Südfrucht-Themes. Immer im DOM, sichtbar nur mit data-skin="suedfrucht"
// (skins.css). Reine Dekoration, für Screenreader verborgen.
import { resolveSettings } from "../core/settings.ts";
import { cssVariables } from "../core/themeRuntime.ts";
import { PALM } from "../themes/suedfrucht/beach.ts";
import Fruit from "../themes/suedfrucht/Fruit.tsx";
import { suedfruchtSettings } from "../themes/suedfrucht/settings.ts";
import ShapeIcon from "../themes/suedfrucht/ShapeIcon.tsx";
import "../themes/suedfrucht/minimes.css";

const COLORS = cssVariables(suedfruchtSettings, resolveSettings(suedfruchtSettings, {}));
const FRUITS = ["mango", "ananas", "wassermelone", "kokosnuss", "banane"];

export default function Scenery() {
  return (
    <div className="skin-scenery theme-suedfrucht" style={COLORS} aria-hidden="true">
      <span className="skin-sun" />
      <ShapeIcon shape={PALM} className="skin-palm skin-palm-left" />
      <ShapeIcon shape={PALM} className="skin-palm skin-palm-right" />
      <div className="skin-fruits">
        {FRUITS.map(id => <span key={id} className="skin-fruit"><Fruit id={id} faces /></span>)}
      </div>
    </div>
  );
}
