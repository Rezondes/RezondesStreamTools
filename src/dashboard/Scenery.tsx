// Scenery behind the dashboard in the Urlaub skin: sun, palms left and right and a few beach things in the sand, with
// the shapes and default colors of the Urlaub theme. Always in the DOM, visible only with data-skin="urlaub"
// (skins.css). Pure decoration, hidden from screen readers.
import { resolveSettings } from "../core/settings.ts";
import { cssVariables } from "../core/themeRuntime.ts";
import { PALM } from "../themes/urlaub/beach.ts";
import BeachThing from "../themes/urlaub/BeachThing.tsx";
import { urlaubSettings } from "../themes/urlaub/settings.ts";
import ShapeIcon from "../themes/urlaub/ShapeIcon.tsx";
import "../themes/urlaub/minimes.css";

const COLORS = cssVariables(urlaubSettings, resolveSettings(urlaubSettings, {}));
const THINGS = ["rettungsring", "badeente", "wasserball", "eis", "seestern"];

export default function Scenery() {
  return (
    <div className="skin-scenery theme-urlaub" style={COLORS} aria-hidden="true">
      <span className="skin-sun" />
      <ShapeIcon shape={PALM} className="skin-palm skin-palm-left" />
      <ShapeIcon shape={PALM} className="skin-palm skin-palm-right" />
      <div className="skin-fruits">
        {THINGS.map(id => <span key={id} className="skin-fruit"><BeachThing id={id} faces /></span>)}
      </div>
    </div>
  );
}
