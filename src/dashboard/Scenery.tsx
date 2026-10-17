// Scenery behind the dashboard in the Südfrucht skin: sun, palms left and right and a few fruits in the sand, with
// the shapes and default colors of the Südfrucht theme. Always in the DOM, visible only with data-skin="suedfrucht"
// (skins.css). Pure decoration, hidden from screen readers.
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
