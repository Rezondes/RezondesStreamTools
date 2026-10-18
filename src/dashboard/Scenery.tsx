// Scenery behind the dashboard in the themed skins, with the shapes and default colors of each theme: Urlaub with sun,
// palms and beach things, Plantage with sun, mango trees and mango soldiers, KOTH with the hill, radio mast and soldiers
// of the three factions. Always in the DOM, skins.css shows only the one of the active skin. Pure decoration, hidden from
// screen readers.
import type { CSSProperties } from "react";
import { minimeTeamColorKey } from "../core/minimeFields.ts";
import { resolveSettings } from "../core/settings.ts";
import type { ThemeSchema } from "../core/theme.ts";
import { cssVariables } from "../core/themeRuntime.ts";
import { HILL, TOWER } from "../themes/koth/hill.ts";
import { kothSettings, TEAM_SET } from "../themes/koth/settings.ts";
import KothShape from "../themes/koth/ShapeIcon.tsx";
import Soldier from "../themes/koth/Soldier.tsx";
import { MANGO_TREE } from "../themes/plantage/field.ts";
import Mango from "../themes/plantage/Mango.tsx";
import { plantageSettings } from "../themes/plantage/settings.ts";
import { PALM } from "../themes/urlaub/beach.ts";
import BeachThing from "../themes/urlaub/BeachThing.tsx";
import { urlaubSettings } from "../themes/urlaub/settings.ts";
import UrlaubShape from "../themes/urlaub/ShapeIcon.tsx";
import "../themes/urlaub/minimes.css";
import "../themes/plantage/minimes.css";
import "../themes/koth/minimes.css";

const colors = (schema: ThemeSchema) => cssVariables(schema, resolveSettings(schema, {}));
const URLAUB = colors(urlaubSettings);
const PLANTAGE = colors(plantageSettings);
const KOTH_VALUES = resolveSettings(kothSettings, {});
const KOTH = colors(kothSettings);
const THINGS = ["rettungsring", "badeente", "wasserball", "eis", "seestern"];
const ROLES = ["sturm", "medic", "mg", "sniper", "grenadier"];
// One soldier per faction with its own role, in the faction's default color
const TROOPS = TEAM_SET.variants.map((team, index) => ({ team: team.id, role: ROLES[index * 2], color: KOTH_VALUES[minimeTeamColorKey(team.id)] as string }));
const TREE_MANGOS = [[70, 120], [150, 96], [110, 150], [180, 140]];

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
        <span className="skin-sun" />
        {["left", "right"].map(side => (
          <svg key={side} className={`skin-tree skin-tree-${side}`} viewBox={MANGO_TREE.viewBox}>
            {MANGO_TREE.parts.map((part, index) => <path key={index} className={`part-${part.kind}`} d={part.d} />)}
            {TREE_MANGOS.map(([x, y]) => <ellipse key={`${x}-${y}`} className="skin-tree-mango" cx={x} cy={y} rx="11" ry="15" />)}
          </svg>
        ))}
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
    </>
  );
}
