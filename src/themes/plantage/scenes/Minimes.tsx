// Minimes of the Plantage theme: joined chatters as mango soldiers with face, helmet and the weapon of their role
// (assault rifle, medic bag, LMG, sniper rifle, grenade launcher) that hop across the field, with the name on a crate label
// or a ribbon. Own animations: reloading, fixing the helmet, looking around, sleeping; they cheer when their chatter
// writes. Now and then they fight (core, minimeCombat.ts): a shooter aims and fires, a hit mango splashes juice, tips over
// with cross eyes and a medic hops over and revives it. Who is in and what everyone does comes from useMinimes.
// Transparent, recommended 1920x360 at the bottom edge of the picture. Parameters: ?demo, ?demo=<n>
import { useMemo, useState, type CSSProperties } from "react";
import { DEMO_FIRST_LOGIN } from "../../../core/demo.ts";
import { useMinimes, type MinimeCombatScene } from "../../../core/hooks/useMinimes.ts";
import { actorRun, actorStyle, type MinimeAction, type MinimeActor } from "../../../core/minimeBehavior.ts";
import { shownRole } from "../../../core/minimeCombat.ts";
import { readMinimeOptions } from "../../../core/minimeFields.ts";
import { hopStyle } from "../../../core/minimeHops.ts";
import { params } from "../../../core/params.ts";
import Mango from "../Mango.tsx";
import { EXPLOSIVE, ROLE_SET } from "../mangos.ts";
import { COMBAT_TONES } from "../tones.ts";
import { usePlantage } from "../usePlantage.ts";
import "../../../core/minimeHops.css";
import "../minimes.css";

const DEMO_MEDIC = params.has("demo") ? DEMO_FIRST_LOGIN : null;
// Fights with the roles of the mangos, the grenadier fires explosions; stable for useMinimes
const COMBAT: MinimeCombatScene = { roles: ROLE_SET, explosive: EXPLOSIVE, sounds: COMBAT_TONES };
// fixed: juice drops when a mango is hit
const DROPS = 8;

export default function Minimes() {
  const values = usePlantage();
  // Width of the scene once on load (OBS source), it stays afterwards
  const [widthPx] = useState(() => innerWidth);
  const catalog = useMemo<MinimeAction[]>(() => [
    { name: "reload", durationMs: values.reloadMs, weight: values.reloadWeight },
    { name: "helmet", durationMs: values.helmetMs, weight: values.helmetWeight },
    { name: "look", durationMs: values.lookMs, weight: values.lookWeight },
    { name: "sleep", durationMs: values.sleepMs, weight: values.sleepWeight },
  ], [values]);
  const reaction = useMemo<MinimeAction>(() => ({ name: "cheer", durationMs: values.cheerMs, weight: 0 }), [values.cheerMs]);
  const actors = useMinimes({ catalog, reaction, widthPx, combat: COMBAT });
  const enabled = useMemo(() => readMinimeOptions(values, ROLE_SET).rules.variants?.map(variant => variant.id) ?? [], [values]);
  const roleOf = (actor: MinimeActor) => shownRole(actor, enabled, values.mangoDefault, DEMO_MEDIC);
  const roles = new Map(actors.map(actor => [actor.login, roleOf(actor)]));
  return (
    <div className={`pl-minimes enter-${values.mangoEnter} exit-${values.mangoExit}`} aria-hidden="true">
      {actors.map(actor => {
        const shooter = actor.combat ? roles.get(actor.combat.shooter) : undefined;
        return <Soldier key={actor.login} actor={actor} role={actor.combat?.variant ?? roleOf(actor)} blast={shooter !== undefined && EXPLOSIVE.includes(shooter)} />;
      })}
    </div>
  );
}

// blast: the shot that hit this mango was an explosion
function Soldier({ actor, role, blast }: { actor: MinimeActor; role: string; blast: boolean }) {
  const values = usePlantage();
  // Position, movement, duration and facing from the core (actorStyle), plus the hops of the core (hopStyle)
  const style = { ...actorStyle(actor), ...hopStyle(actor, values.hopMs) } as CSSProperties;
  const run = actorRun(actor);
  const down = actor.action === "down";
  return (
    <div className={`pl-minime role-${role} action-${actor.action}${EXPLOSIVE.includes(role) ? " explosive" : ""}`} style={style}>
      {values.mangoNames && <span className={`pl-minime-name name-${values.mangoNameStyle}`}>{actor.user}</span>}
      <div key={run} className="minime-hop">
        <div className="pl-minime-body">
          <div className="pl-minime-flip">
            <Mango role={role} faces={values.mangoFaces} down={down} />
            {actor.action === "fire" && <span className="pl-muzzle" />}
          </div>
          {actor.action === "sleep" && <span className="pl-minime-zz">{values.sleepText}</span>}
          {actor.action === "revive" && <span className="pl-revive" />}
          {down && <Juice blast={blast} />}
        </div>
      </div>
      <div key={`shadow-${run}`} className="pl-minime-shadow minime-hop-shadow" />
    </div>
  );
}

function Juice({ blast }: { blast: boolean }) {
  return (
    <div className={`pl-juice${blast ? " blast" : ""}`}>
      {Array.from({ length: DROPS }, (_, index) => <i key={index} style={{ "--i": index, "--n": DROPS } as CSSProperties} />)}
    </div>
  );
}
