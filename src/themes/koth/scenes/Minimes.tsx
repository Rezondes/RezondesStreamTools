// Minimes of the KOTH theme: joined chatters as small 3D soldiers with helmet, uniform in their faction color and the
// weapon of their role, on fixed places at the hill (they neither walk nor hop), with the name on a band or a sign. Own
// animations on the spot: sighting, reloading, taking cover, going prone, looking around, saluting; they cheer when their
// chatter writes. Now and then factions fight (core, minimeCombat.ts): a shooter aims and fires at another faction, a hit
// soldier falls in a dust cloud and a medic of its faction crawls over and revives it. On top it shows which faction holds
// the hill (most soldiers). The core moves an anchor per soldier with CSS, the 3D soldier follows it (PartFigure of the
// core). Transparent, recommended 1920x360 at the bottom edge. Parameters: ?demo, ?demo=<n>
import { type CSSProperties, type RefObject, useMemo, useRef, useState } from "react";
import { DEMO_FIRST_LOGIN } from "../../../core/demo.ts";
import { seedOf } from "../../../core/hash.ts";
import { useAnchors } from "../../../core/hooks/useAnchors.ts";
import { useMinimes, type MinimeCombatScene } from "../../../core/hooks/useMinimes.ts";
import { actorRun, actorStyle, shownTeam, teamCounts, type MinimeAction, type MinimeActor } from "../../../core/minimeBehavior.ts";
import { shownRole } from "../../../core/minimeCombat.ts";
import { readMinimeOptions } from "../../../core/minimeFields.ts";
import { params } from "../../../core/params.ts";
import { fillTemplate } from "../../../core/template.ts";
import FigureStage from "../../../core/three/FigureStage.tsx";
import { TEAM_SET } from "../settings.ts";
import { EXPLOSIVE, hillState, ROLE_SET } from "../soldiers3d.ts";
import Soldier3D from "../three/Soldier3D.tsx";
import { COMBAT_TONES } from "../tones.ts";
import { teamColor, teamLabel, useKoth } from "../useKoth.ts";
import "../minimes.css";

const DEMO = params.has("demo");
const DEMO_MEDIC = DEMO ? DEMO_FIRST_LOGIN : null;
// Fights with roles and factions, the grenadier fires explosions; stable for useMinimes
const COMBAT: MinimeCombatScene = { roles: ROLE_SET, teams: TEAM_SET, explosive: EXPLOSIVE, sounds: COMBAT_TONES };

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
  const stage = useRef<HTMLDivElement>(null);
  const anchorOf = useAnchors();
  const roleOf = (actor: MinimeActor) => shownRole(actor, roles, values.soldierDefault, DEMO_MEDIC);
  const shown = new Map(actors.map(actor => [actor.login, roleOf(actor)]));
  const colorOf = (actor: MinimeActor) => {
    const team = shownTeam(actor, teams, DEMO);
    return team ? teamColor(values, team) : values.olive;
  };
  return (
    <div ref={stage} className={`kh-minimes enter-${values.soldierEnter} exit-${values.soldierExit}`} aria-hidden="true">
      {values.holderBanner && <Holder actors={actors} teams={teams} />}
      {actors.map(actor => <Anchor key={actor.login} actor={actor} color={colorOf(actor)} anchor={anchorOf(actor.login)} />)}
      <FigureStage className="kh-minime-canvas" level={values.quality} light={values.soldierLight}>
        {actors.map(actor => {
          const shooter = actor.combat ? shown.get(actor.combat.shooter) : undefined;
          return (
            <Soldier3D
              key={actor.login}
              role={actor.combat?.variant ?? roleOf(actor)}
              team={colorOf(actor)}
              values={values}
              run={{ animation: actor.action, startedAt: actor.startedAt, durationMs: actor.durationMs, facing: actor.facing }}
              anchor={anchorOf(actor.login)}
              stage={stage}
              seed={seedOf(actor.login)}
              blast={shooter !== undefined && EXPLOSIVE.includes(shooter)}
            />
          );
        })}
      </FigureStage>
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

// The box the core moves (position, facing, appearing and leaving) with the name above, the shadow below and the cross of
// a revive; the 3D soldier follows it
function Anchor({ actor, color, anchor }: { actor: MinimeActor; color: string; anchor: RefObject<HTMLDivElement | null> }) {
  const values = useKoth();
  const style = { ...actorStyle(actor), "--team": color } as CSSProperties;
  return (
    <div className={`kh-minime action-${actor.action}`} style={style}>
      {values.soldierNames && <span className={`kh-minime-name name-${values.soldierNameStyle}`}>{actor.user}</span>}
      <div key={actorRun(actor)} className="kh-minime-body">
        <div className="kh-minime-anchor" ref={anchor} />
        {actor.action === "revive" && <span className="kh-revive" />}
      </div>
      <div className="kh-minime-shadow" />
    </div>
  );
}
