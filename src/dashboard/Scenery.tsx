// Scenery behind the dashboard in the themed skins, with the shapes and default colors of each theme: Urlaub with sun,
// palms and beach things, Plantage with the illustrated mango field of its scenes and mango soldiers, KOTH with the hill,
// radio mast and soldiers of the three factions, Bärenbande with the watercolor world and the bear tower. Always in the DOM, skins.css shows only the one of the active skin. Pure
// decoration, hidden from screen readers.
import type { CSSProperties } from "react";
import { minimeTeamColorKey } from "../core/minimeFields.ts";
import { ThemeValues } from "../core/hooks/useSettings.ts";
import { resolveSettings } from "../core/settings.ts";
import type { ThemeSchema } from "../core/theme.ts";
import { cssVariables } from "../core/themeRuntime.ts";
import BearTower from "../themes/bears/BearTower.tsx";
import { bearsSettings } from "../themes/bears/settings.ts";
import World from "../themes/bears/World.tsx";
import { HILL, TOWER } from "../themes/koth/hill.ts";
import { kothSettings, TEAM_SET } from "../themes/koth/settings.ts";
import KothShape from "../themes/koth/ShapeIcon.tsx";
import Soldier from "../themes/koth/Soldier.tsx";
import Field from "../themes/plantage/Field.tsx";
import Mango from "../themes/plantage/Mango.tsx";
import { plantageSettings } from "../themes/plantage/settings.ts";
import { PALM } from "../themes/urlaub/beach.ts";
import BeachThing from "../themes/urlaub/BeachThing.tsx";
import { urlaubSettings } from "../themes/urlaub/settings.ts";
import UrlaubShape from "../themes/urlaub/ShapeIcon.tsx";
import "../themes/urlaub/minimes.css";
import "../themes/plantage/minimes.css";
import "../themes/plantage/theme.css";
import "../themes/koth/minimes.css";
import "../themes/bears/theme.css";

const colors = (schema: ThemeSchema) => cssVariables(schema, resolveSettings(schema, {}));
const URLAUB = colors(urlaubSettings);
const PLANTAGE_VALUES = resolveSettings(plantageSettings, {});
const PLANTAGE = cssVariables(plantageSettings, PLANTAGE_VALUES);
const KOTH_VALUES = resolveSettings(kothSettings, {});
const KOTH = colors(kothSettings);
const BEARS_VALUES = resolveSettings(bearsSettings, {});
const BEARS = cssVariables(bearsSettings, BEARS_VALUES);
const THINGS = ["rettungsring", "badeente", "wasserball", "eis", "seestern"];
const ROLES = ["sturm", "medic", "mg", "sniper", "grenadier"];
// One soldier per faction with its own role, in the faction's default color
const TROOPS = TEAM_SET.variants.map((team, index) => ({ team: team.id, role: ROLES[index * 2], color: KOTH_VALUES[minimeTeamColorKey(team.id)] as string }));

export default function Scenery() {
  return (
    <>
      <div className="skin-scenery skin-scenery-urlaub theme-urlaub" style={URLAUB} aria-hidden="true">
        <span className="skin-sun" />
        <UrlaubShape shape={PALM} className="skin-palm skin-palm-left" />
        <UrlaubShape shape={PALM} className="skin-palm skin-palm-right" />
        <div className="skin-figures">
          {THINGS.map(id => <span key={id} className="skin-figure"><BeachThing id={id} faces /></span>)}
        </div>
      </div>
      <div className="skin-scenery skin-scenery-plantage theme-plantage" style={PLANTAGE} aria-hidden="true">
        <ThemeValues.Provider value={PLANTAGE_VALUES}>
          <Field time="mittag" />
        </ThemeValues.Provider>
        <div className="skin-figures">
          {ROLES.map(role => <span key={role} className="skin-figure"><Mango role={role} faces down={false} /></span>)}
        </div>
      </div>
      <div className="skin-scenery skin-scenery-koth theme-koth" style={KOTH} aria-hidden="true">
        <KothShape shape={HILL} className="skin-hill" />
        <KothShape shape={TOWER} className="skin-tower" />
        <div className="skin-figures">
          {TROOPS.map(troop => (
            <span key={troop.team} className="skin-figure" style={{ "--team": troop.color } as CSSProperties}>
              <Soldier role={troop.role} faces down={false} />
            </span>
          ))}
        </div>
      </div>
      <div className="skin-scenery skin-scenery-bears theme-bears bb-blinking" style={BEARS} aria-hidden="true">
        <ThemeValues.Provider value={BEARS_VALUES}>
          <World time="mittag" />
        </ThemeValues.Provider>
        <BearTower className="skin-bear-tower" />
      </div>
    </>
  );
}
