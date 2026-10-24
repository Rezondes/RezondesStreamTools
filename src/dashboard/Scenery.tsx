// Scenery behind the dashboard in the themed skins, with the worlds and default colors of each theme: Urlaub with the
// realistic 3D beach at noon and beach things, Plantage with the PixiJS plantage of its scenes and mango soldiers, KOTH with
// the 3D hill of its scenes, Bärenbande with the watercolor world and the bear tower, Chaos with its painted wall,
// Dachdecker with the roof frame as plan lines, a dimension chain and the title block, Kebab with the chef at the spit
// and the arc title as still red lines. Only the scenery of the active skin
// is mounted (the worlds load in their own chunks and each needs its canvas). Pure decoration, hidden from screen readers.
import { lazy, Suspense } from "react";
import { ThemeValues } from "../core/hooks/useSettings.ts";
import { resolveSettings } from "../core/settings.ts";
import { cssVariables } from "../core/themeRuntime.ts";
import BearTower from "../themes/bears/BearTower.tsx";
import { chaosSettings } from "../themes/chaos/settings.ts";
import Progress from "../themes/dachdecker/plan/Progress.tsx";
import TitleBlock from "../themes/dachdecker/plan/TitleBlock.tsx";
import { dachdeckerSettings, type DachdeckerValues } from "../themes/dachdecker/settings.ts";
import Sketch from "../themes/dachdecker/Sketch.tsx";
import { frameDims } from "../themes/dachdecker/frame.ts";
import { kebabSettings, type KebabValues } from "../themes/kebab/settings.ts";
import { dogsSettings, type DogsValues } from "../themes/dogs/settings.ts";
import { fillTemplate } from "../core/template.ts";
import { bearsSettings } from "../themes/bears/settings.ts";
import { kothSettings } from "../themes/koth/settings.ts";
import Mango from "../themes/plantage/Mango.tsx";
import { plantageSettings } from "../themes/plantage/settings.ts";
import BeachThing from "../themes/urlaub/BeachThing.tsx";
import { urlaubSettings, type UrlaubValues } from "../themes/urlaub/settings.ts";
import type { KothValues } from "../themes/koth/settings.ts";
import type { PlantageValues } from "../themes/plantage/settings.ts";
import type { Skin } from "./skin.ts";
import "../themes/urlaub/minimes.css";
import "../themes/plantage/minimes.css";
import "../themes/plantage/theme.css";
import "../themes/bears/theme.css";
import "../themes/chaos/theme.css";
import "../themes/dachdecker/theme.css";
import "../themes/kebab/theme.css";

// The painted Bärenbande world loads Rough.js, the other worlds three.js or PixiJS, so each comes in its own chunk
const BearsWorld = lazy(() => import("../themes/bears/WorldCanvas.tsx"));
const UrlaubWorld = lazy(() => import("../themes/urlaub/three/BeachWorld.tsx"));
const PlantageWorld = lazy(() => import("../themes/plantage/pixi/WorldBackdrop.tsx"));
const KothWorld = lazy(() => import("../themes/koth/three/WorldBackdrop.tsx"));
const ChaosWall = lazy(() => import("../themes/chaos/PaintedWall.tsx"));
const KebabScenery = lazy(() => import("../themes/kebab/SkinScenery.tsx"));
const DogsScenery = lazy(() => import("../themes/dogs/SkinScenery.tsx"));

const URLAUB_VALUES = resolveSettings(urlaubSettings, {});
const URLAUB = cssVariables(urlaubSettings, URLAUB_VALUES);
const URLAUB_CLOCK = { time: 0 }; // the beach stands still at noon
const PLANTAGE_VALUES = resolveSettings(plantageSettings, {});
const PLANTAGE = cssVariables(plantageSettings, PLANTAGE_VALUES);
const KOTH_VALUES = resolveSettings(kothSettings, {});
const KOTH = cssVariables(kothSettings, KOTH_VALUES);
const BEARS_VALUES = resolveSettings(bearsSettings, {});
const BEARS = cssVariables(bearsSettings, BEARS_VALUES);
const CHAOS_VALUES = resolveSettings(chaosSettings, {});
const CHAOS = cssVariables(chaosSettings, CHAOS_VALUES);
const DACHDECKER_VALUES = resolveSettings(dachdeckerSettings, {}) as unknown as DachdeckerValues;
const DACHDECKER = cssVariables(dachdeckerSettings, resolveSettings(dachdeckerSettings, {}));
const DACHDECKER_BLOCK = DACHDECKER_VALUES.startingBlockLines.map(line => fillTemplate(line, { channel: DACHDECKER_VALUES.channelName, date: new Date().toLocaleDateString("sv-SE") }));
const KEBAB_VALUES = resolveSettings(kebabSettings, {}) as unknown as KebabValues;
const KEBAB = cssVariables(kebabSettings, resolveSettings(kebabSettings, {}));
const DOGS_VALUES = resolveSettings(dogsSettings, {}) as unknown as DogsValues;
const DOGS_SCENERY = (
  <div className="skin-scenery skin-scenery-dogs" aria-hidden="true">
    <Suspense fallback={null}><DogsScenery values={DOGS_VALUES} /></Suspense>
  </div>
);
// Share of the dimension chain drawn in terracotta
const CHAIN_SHARE = 0.62;
const THINGS = ["rettungsring", "badeente", "wasserball", "eis", "seestern"];
const ROLES = ["sturm", "medic", "mg", "sniper", "grenadier"];

export default function Scenery({ skin }: { skin: Skin }) {
  if (skin === "urlaub") return (
    <div className="skin-scenery skin-scenery-urlaub theme-urlaub" style={URLAUB} aria-hidden="true">
      <ThemeValues.Provider value={URLAUB_VALUES}>
        <Suspense fallback={null}><UrlaubWorld values={URLAUB_VALUES as unknown as UrlaubValues} clock={URLAUB_CLOCK} scene="brb" /></Suspense>
      </ThemeValues.Provider>
      <div className="skin-figures">
        {THINGS.map(id => <span key={id} className="skin-figure"><BeachThing id={id} faces /></span>)}
      </div>
    </div>
  );
  if (skin === "plantage") return (
    <div className="skin-scenery skin-scenery-plantage theme-plantage" style={PLANTAGE} aria-hidden="true">
      <ThemeValues.Provider value={PLANTAGE_VALUES}>
        <Suspense fallback={null}><PlantageWorld values={PLANTAGE_VALUES as unknown as PlantageValues} kind="brb" /></Suspense>
      </ThemeValues.Provider>
      <div className="skin-figures">
        {ROLES.map(role => <span key={role} className="skin-figure"><Mango role={role} faces down={false} /></span>)}
      </div>
    </div>
  );
  if (skin === "koth") return (
    <div className="skin-scenery skin-scenery-koth theme-koth" style={KOTH} aria-hidden="true">
      <ThemeValues.Provider value={KOTH_VALUES}>
        <Suspense fallback={null}><KothWorld values={KOTH_VALUES as unknown as KothValues} kind="starting" /></Suspense>
      </ThemeValues.Provider>
    </div>
  );
  if (skin === "bears") return (
    <div className="skin-scenery skin-scenery-bears theme-bears bb-blinking" style={BEARS} aria-hidden="true">
      <ThemeValues.Provider value={BEARS_VALUES}>
        <Suspense fallback={null}><BearsWorld time="mittag" cached /></Suspense>
      </ThemeValues.Provider>
      <BearTower className="skin-bear-tower" />
    </div>
  );
  if (skin === "chaos") return (
    <div className="skin-scenery skin-scenery-chaos theme-chaos" style={CHAOS} aria-hidden="true">
      <ThemeValues.Provider value={CHAOS_VALUES}>
        <Suspense fallback={null}><ChaosWall seed="dashboard" gesture="zweix" mainColor="cyan" boilFps={(CHAOS_VALUES as { boilFps: number }).boilFps} /></Suspense>
      </ThemeValues.Provider>
    </div>
  );
  if (skin === "dachdecker") return (
    <div className="skin-scenery skin-scenery-dachdecker theme-dachdecker" style={DACHDECKER} aria-hidden="true">
      <Sketch dims={frameDims(DACHDECKER_VALUES)} className="skin-roof" />
      <div className="skin-chain"><Progress share={CHAIN_SHARE} /></div>
      <div className="skin-block"><TitleBlock lines={DACHDECKER_BLOCK} opacity={1} /></div>
    </div>
  );
  if (skin === "kebab") return (
    <div className="skin-scenery skin-scenery-kebab theme-kebab" style={KEBAB} aria-hidden="true">
      <Suspense fallback={null}><KebabScenery values={KEBAB_VALUES} /></Suspense>
    </div>
  );
  if (skin === "dogs") return DOGS_SCENERY;
  return null;
}
