// Parts of the KOTH world that only one screen has: at night (BRB) the searchlight on the bunker and the camp fire before
// the first tent, at dusk (Ending) the flares in the faction colors.
import type { ScreenKind } from "../../../core/screens/screens.ts";
import { particleCount } from "../../../core/three/quality.ts";
import type { KothClock, Steps } from "../build.ts";
import type { CampItem } from "../camp.ts";
import { TEAM_SET, type KothValues } from "../settings.ts";
import { hillHeight } from "../terrain.ts";
import { teamColor } from "../useKoth.ts";
import Campfire from "./Campfire.tsx";
import Flares from "./Flares.tsx";
import Searchlight from "./Searchlight.tsx";

type Props = { kind: ScreenKind; values: KothValues; clock: KothClock; steps: Steps; items: readonly CampItem[]; wood: string };

// fixed: the fire burns this far in front of the tent door, the lamp sits on the bunker roof, sparks of the fire
const FIRE_DISTANCE = 2.6;
const ROOF = 0.2;
const FIRE_SPARKS = 40;

export default function ScreenParts({ kind, values, clock, steps, items, wood }: Props) {
  if (kind === "brb") {
    const bunker = items.find(item => item.kind === "bunker");
    const tent = items.find(item => item.kind === "tent");
    const fireX = tent ? tent.x + Math.cos(tent.turn) * FIRE_DISTANCE : 0;
    const fireZ = tent ? tent.z - Math.sin(tent.turn) * FIRE_DISTANCE : 0;
    return (
      <>
        {values.searchlightOn && bunker && (
          <Searchlight clock={clock} at={[bunker.x, bunker.y + ROOF, bunker.z]} color={values.sun} from={values.searchlightFrom} to={values.searchlightTo} speed={values.searchlightSpeed} />
        )}
        {values.campfireOn && tent && (
          <Campfire clock={clock} at={[fireX, hillHeight(fireX, fireZ, values.hillHeight), fireZ]} flame={values.accent} wood={wood} sparks={particleCount(FIRE_SPARKS, values.quality)} />
        )}
      </>
    );
  }
  if (kind === "ending" && values.flaresOn) {
    return (
      <Flares
        clock={clock} start={steps.flag.start} seed={values.worldSeed} every={values.flaresEvery} sparks={particleCount(values.flareSparks, values.quality)}
        colors={TEAM_SET.variants.map(team => teamColor(values, team.id))} sound={values.flareSound}
      />
    );
  }
  return null;
}
