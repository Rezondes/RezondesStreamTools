// Minimes of the KOTH theme: joined chatters as small soldiers with helmet, uniform in their faction color and the weapon
// of their role, on fixed places at the hill (they neither walk nor hop), with the name on a band or a sign. Own
// animations on the spot: sighting, reloading, taking cover, going prone, looking around, saluting; they cheer when their
// chatter writes. Now and then factions fight (core, minimeCombat.ts): a shooter aims and fires at another faction, a hit
// soldier falls in a dust cloud and a medic of its faction crawls over and revives it. On top it shows which faction holds
// the hill (most soldiers). Transparent, recommended 1920x360 at the bottom edge. Parameters: ?demo, ?demo=<n>
import { useMemo, useState, type CSSProperties } from "react";
import { DEMO_FIRST_LOGIN } from "../../../core/demo.ts";
import { useMinimes, type MinimeCombatScene } from "../../../core/hooks/useMinimes.ts";
import { actorRun, actorStyle, shownTeam, teamCounts, type MinimeAction, type MinimeActor } from "../../../core/minimeBehavior.ts";
import { shownRole } from "../../../core/minimeCombat.ts";
import { minimeTeamColorKey, minimeTeamLabelKey, readMinimeOptions } from "../../../core/minimeFields.ts";
import { params } from "../../../core/params.ts";
import { fillTemplate } from "../../../core/template.ts";
import { TEAM_SET, type KothValues } from "../settings.ts";
import Soldier from "../Soldier.tsx";
import { EXPLOSIVE, hillState, ROLE_SET } from "../soldiers.ts";
import { COMBAT_TONES } from "../tones.ts";
import { useKoth } from "../useKoth.ts";
import "../minimes.css";

const DEMO = params.has("demo");
const DEMO_MEDIC = DEMO ? DEMO_FIRST_LOGIN : null;
// Fights with roles and factions, the grenadier fires explosions; stable for useMinimes
const COMBAT: MinimeCombatScene = { roles: ROLE_SET, teams: TEAM_SET, explosive: EXPLOSIVE, sounds: COMBAT_TONES };
// fixed: dust puffs when a soldier is hit
const PUFFS = 6;

const teamColor = (values: KothValues, team: string) => String((values as Record<string, unknown>)[minimeTeamColorKey(team)]);
const teamLabel = (values: KothValues, team: string) => String((values as Record<string, unknown>)[minimeTeamLabelKey(team)]);

export default function Minimes() {
  const values = useKoth();
  // Width of the scene once on load (OBS source), it stays afterwards
  const [widthPx] = useState(() => innerWidth);
  const catalog = useMemo<MinimeAction[]>(() => [
    { name: "sight", durationMs: values.sightMs, weight: values.sightWeight },
    { name: "reload", durationMs: values.reloadMs, weight: values.reloadWeight },
    { name: "cover", durationMs: values.coverMs, weight: values.coverWeight },
    { name: "prone", durationMs: values.proneMs, weight: values.proneWeight },
    { name: "look", durationMs: values.lookMs, weight: values.lookWeight },
    { name: "salute", durationMs: values.saluteMs, weight: values.saluteWeight },
  ], [values]);
  const reaction = useMemo<MinimeAction>(() => ({ name: "cheer", durationMs: values.cheerMs, weight: 0 }), [values.cheerMs]);
  const actors = useMinimes({ catalog, reaction, widthPx, combat: COMBAT });
  const { roles, teams } = useMemo(() => {
    const rules = readMinimeOptions(values, ROLE_SET, TEAM_SET).rules;
    return { roles: rules.variants?.map(variant => variant.id) ?? [], teams: rules.teams?.map(team => team.id) ?? [] };
  }, [values]);
  const roleOf = (actor: MinimeActor) => shownRole(actor, roles, values.soldierDefault, DEMO_MEDIC);
  const shown = new Map(actors.map(actor => [actor.login, roleOf(actor)]));
  return (
    <div className={`kh-minimes enter-${values.soldierEnter} exit-${values.soldierExit}`} aria-hidden="true">
      {values.holderBanner && <Holder actors={actors} teams={teams} />}
      {actors.map(actor => {
        const team = shownTeam(actor, teams, DEMO);
        const shooter = actor.combat ? shown.get(actor.combat.shooter) : undefined;
        return (
          <Trooper
            key={actor.login}
            actor={actor}
            role={actor.combat?.variant ?? roleOf(actor)}
            color={team ? teamColor(values, team) : values.olive}
            blast={shooter !== undefined && EXPLOSIVE.includes(shooter)}
          />
        );
      })}
    </div>
  );
}

// Which faction holds the hill: the one with the most soldiers, a tie is contested, nobody there shows nothing
function Holder({ actors, teams }: { actors: readonly MinimeActor[]; teams: readonly string[] }) {
  const values = useKoth();
  const state = hillState(teamCounts(actors, teams, DEMO));
  if (state.kind === "empty") return null;
  const held = state.kind === "held";
  const style = held ? ({ "--team": teamColor(values, state.team) } as CSSProperties) : undefined;
  return (
    <div className={`kh-holder${held ? " held" : " contested"}`} style={style}>
      <i className="kh-holder-flag" />
      {held ? fillTemplate(values.holderText, { team: teamLabel(values, state.team) }) : values.contestedText}
    </div>
  );
}

// blast: the shot that hit this soldier was an explosion
function Trooper({ actor, role, color, blast }: { actor: MinimeActor; role: string; color: string; blast: boolean }) {
  const values = useKoth();
  // Position, movement, duration and facing from the core (actorStyle), the faction color for the uniform
  const style = { ...actorStyle(actor), "--team": color } as CSSProperties;
  const run = actorRun(actor);
  const down = actor.action === "down";
  return (
    <div className={`kh-minime role-${role} action-${actor.action}${EXPLOSIVE.includes(role) ? " explosive" : ""}`} style={style}>
      {values.soldierNames && <span className={`kh-minime-name name-${values.soldierNameStyle}`}>{actor.user}</span>}
      <div key={run} className="kh-minime-body">
        <div className="kh-minime-flip">
          <Soldier role={role} faces={values.soldierFaces} down={down} />
          {actor.action === "fire" && <span className="kh-muzzle" />}
        </div>
        {actor.action === "revive" && <span className="kh-revive" />}
        {down && <Dust blast={blast} />}
      </div>
      <div className="kh-minime-shadow" />
    </div>
  );
}

function Dust({ blast }: { blast: boolean }) {
  return (
    <div className={`kh-dust-cloud${blast ? " blast" : ""}`}>
      {Array.from({ length: PUFFS }, (_, index) => <i key={index} style={{ "--i": index, "--n": PUFFS } as CSSProperties} />)}
    </div>
  );
}
