// Minimes of the Bärenbande theme, transparent, recommended 1920x360 at the bottom edge of the picture: joined chatters as
// small bears (Eisbär, Grizzly, Panda) of the character model that waddle along the bottom edge, with the name on a paper
// sign. Own animations: selfie, snack, wave, dance, looking around, sleeping; they wave back at chat. Now and then one
// bear of every kind stacks up to a tower (core, minimeStack.ts): they gather, the base braces on all fours, the others
// climb on its back, stand, waddle together and step off again. Who is in and what everyone does comes from useMinimes.
// Parameters: ?demo, ?demo=<n>
import { useMemo, useState, type CSSProperties } from "react";
import { useMinimes, type MinimeStackScene } from "../../../core/hooks/useMinimes.ts";
import { actorStyle, shownVariant, type MinimeAction, type MinimeActor } from "../../../core/minimeBehavior.ts";
import { readMinimeOptions } from "../../../core/minimeFields.ts";
import { params } from "../../../core/params.ts";
import Bear from "../Bear.tsx";
import { BEAR_IDS, type BearId } from "../bears.ts";
import { POSES, type Drops } from "../rig.ts";
import { BEAR_SET, MINIME_REACTION, minimePose, towerLift } from "../minimeBears.ts";
import { climbTone } from "../tones.ts";
import { useBears } from "../useBears.ts";
import "../minimes.css";

const DEMO = params.has("demo");
const STACK: MinimeStackScene = { variants: BEAR_SET, sound: climbTone };
const STAND_HEIGHT = POSES.stand.height;
// Steps in which a minime stands on the back below (its legs reach down onto that back)
const LIFTED = new Set(["stacked", "stackWalk"]);
const isBear = (id: string): id is BearId => (BEAR_IDS as readonly string[]).includes(id);

// How a minime stands in a tower: lift above the ground and shift to the middle of the back below in px, the top level,
// the facing of the base
type InTower = { lift: number; shift: number; drops: Drops; top: boolean; facing: 1 | -1 } | null;

export default function Minimes() {
  const values = useBears();
  // Width of the scene once on load (OBS source), it stays afterwards
  const [widthPx] = useState(() => innerWidth);
  const catalog = useMemo<MinimeAction[]>(() => [
    { name: "selfie", durationMs: values.selfieMs, weight: values.selfieWeight },
    { name: "snack", durationMs: values.snackMs, weight: values.snackWeight },
    { name: "wave", durationMs: values.waveMs, weight: values.waveWeight },
    { name: "dance", durationMs: values.danceMs, weight: values.danceWeight },
    { name: "look", durationMs: values.lookMs, weight: values.lookWeight },
    { name: "sleep", durationMs: values.sleepMs, weight: values.sleepWeight },
  ], [values]);
  const reaction = useMemo<MinimeAction>(() => ({ name: MINIME_REACTION, durationMs: values.waveReactMs, weight: 0 }), [values.waveReactMs]);
  const actors = useMinimes({ catalog, reaction, widthPx, stack: STACK });
  const enabled = useMemo(() => readMinimeOptions(values, BEAR_SET).rules.variants?.map(variant => variant.id) ?? [], [values]);
  const facings = new Map(actors.map(actor => [actor.login, actor.facing]));
  const inTower = (actor: MinimeActor): InTower => {
    const part = actor.stack;
    if (!part) return null;
    const { members, types } = part.tower;
    const facing = facings.get(members[0]) ?? actor.facing;
    const { lift, shift, drops } = towerLift(types, part.level, values.minimeBearSize, values.stackFit);
    // The model looks left; facing right mirrors the shift
    return { lift, shift: -shift * facing, drops, top: part.level === members.length, facing };
  };
  return (
    <div className={`bb-minimes enter-${values.minimeEnter} exit-${values.minimeExit}`} aria-hidden="true">
      {actors.map(actor => {
        const shown = shownVariant(actor, enabled, values.minimeDefault, DEMO);
        return <Character key={actor.login} actor={actor} bear={[shown, values.minimeDefault].find(isBear) ?? "grizzly"} tower={inTower(actor)} />;
      })}
    </div>
  );
}

function Character({ actor, bear, tower }: { actor: MinimeActor; bear: BearId; tower: InTower }) {
  const values = useBears();
  const pose = minimePose(actor.action, tower?.top, (actor.stack?.level ?? 0) > 1);
  const level = actor.stack?.level ?? 0;
  // Position, movement, duration and facing from the core (actorStyle); in a tower every level looks like the base, is
  // lifted by the backs below it and moves its name sign aside
  const style = {
    ...actorStyle(actor),
    ...(tower ? { "--facing": tower.facing, "--stack-lift": `${tower.lift}px`, "--stack-shift": `${tower.shift}px`, "--name-shift": level > 1 ? (-1) ** level : 0 } : {}),
    "--pose-h": POSES[pose].height / STAND_HEIGHT,
  } as CSSProperties;
  return (
    <div className={`bb-minime action-${actor.action}${tower ? " in-tower" : ""}${level > 1 ? " tower-upper" : ""}`} style={style}>
      <div className="bb-minime-lift">
        {values.minimeNames && <span className="bb-minime-name">{actor.user}</span>}
        <div className="bb-minime-body">
          <div className="bb-minime-flip"><Bear bear={bear} pose={pose} drops={tower && LIFTED.has(actor.action) ? tower.drops : undefined} className="bb-blinking" /></div>
          {actor.action === "sleep" && <span className="bb-minime-zz">{values.sleepText}</span>}
          {actor.action === "selfie" && <span className="bb-minime-flash" />}
        </div>
      </div>
      <div className="bb-minime-shadow" />
    </div>
  );
}
