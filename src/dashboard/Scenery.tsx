// Scenery behind the dashboard in the themed skins, with the shapes and default colors of each theme: Urlaub with sun,
// palms and beach things, Plantage with the illustrated mango field of its scenes and mango soldiers, KOTH with the hill
// and radio mast, Bärenbande with the watercolor world and the bear tower, Chaos with its wall of scribbles and the two brush X, Dachdecker with the roof frame as plan lines, a dimension chain and the title block. Always in the DOM, skins.css shows only the one of the active skin. Pure
// decoration, hidden from screen readers.
import { ThemeValues } from "../core/hooks/useSettings.ts";
import { resolveSettings } from "../core/settings.ts";
import type { ThemeSchema } from "../core/theme.ts";
import { cssVariables } from "../core/themeRuntime.ts";
import BearTower from "../themes/bears/BearTower.tsx";
import ChaosBackdrop from "../themes/chaos/Backdrop.tsx";
import { chaosSettings } from "../themes/chaos/settings.ts";
import Progress from "../themes/dachdecker/plan/Progress.tsx";
import TitleBlock from "../themes/dachdecker/plan/TitleBlock.tsx";
import { dachdeckerSettings, type DachdeckerValues } from "../themes/dachdecker/settings.ts";
import Sketch from "../themes/dachdecker/Sketch.tsx";
import { frameDims } from "../themes/dachdecker/frame.ts";
import { fillTemplate } from "../core/template.ts";
import { bearsSettings } from "../themes/bears/settings.ts";
import World from "../themes/bears/World.tsx";
import { HILL, TOWER } from "../themes/koth/hill.ts";
import { kothSettings } from "../themes/koth/settings.ts";
import KothShape from "../themes/koth/ShapeIcon.tsx";
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
import "../themes/bears/theme.css";
import "../themes/chaos/theme.css";
import "../themes/dachdecker/theme.css";

const colors = (schema: ThemeSchema) => cssVariables(schema, resolveSettings(schema, {}));
const URLAUB = colors(urlaubSettings);
const PLANTAGE_VALUES = resolveSettings(plantageSettings, {});
const PLANTAGE = cssVariables(plantageSettings, PLANTAGE_VALUES);
const KOTH = colors(kothSettings);
const BEARS_VALUES = resolveSettings(bearsSettings, {});
const BEARS = cssVariables(bearsSettings, BEARS_VALUES);
const CHAOS_VALUES = resolveSettings(chaosSettings, {});
const CHAOS = cssVariables(chaosSettings, CHAOS_VALUES);
const DACHDECKER_VALUES = resolveSettings(dachdeckerSettings, {}) as unknown as DachdeckerValues;
const DACHDECKER = cssVariables(dachdeckerSettings, resolveSettings(dachdeckerSettings, {}));
const DACHDECKER_BLOCK = DACHDECKER_VALUES.startingBlockLines.map(line => fillTemplate(line, { channel: DACHDECKER_VALUES.channelName, date: new Date().toLocaleDateString("sv-SE") }));
// Share of the dimension chain drawn in terracotta
const CHAIN_SHARE = 0.62;
const THINGS = ["rettungsring", "badeente", "wasserball", "eis", "seestern"];
const ROLES = ["sturm", "medic", "mg", "sniper", "grenadier"];

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
      </div>
      <div className="skin-scenery skin-scenery-bears theme-bears bb-blinking" style={BEARS} aria-hidden="true">
        <ThemeValues.Provider value={BEARS_VALUES}>
          <World time="mittag" />
        </ThemeValues.Provider>
        <BearTower className="skin-bear-tower" />
      </div>
      <div className="skin-scenery skin-scenery-chaos theme-chaos" style={CHAOS} aria-hidden="true">
        <ThemeValues.Provider value={CHAOS_VALUES}>
          <ChaosBackdrop seed="dashboard" gesture="zweix" mainColor="cyan" />
        </ThemeValues.Provider>
      </div>
      <div className="skin-scenery skin-scenery-dachdecker theme-dachdecker" style={DACHDECKER} aria-hidden="true">
        <Sketch dims={frameDims(DACHDECKER_VALUES)} className="skin-roof" />
        <div className="skin-chain"><Progress share={CHAIN_SHARE} /></div>
        <div className="skin-block"><TitleBlock lines={DACHDECKER_BLOCK} opacity={1} /></div>
      </div>
    </>
  );
}
