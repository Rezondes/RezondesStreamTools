// Minimes of the Bärenbande theme: joined chatters as small bears (Eisbär, Grizzly, Panda) of the character model that
// waddle along the bottom edge, with the name on a paper sign. Own animations: selfie, snack, wave, dance, looking around,
// sleeping; they wave back at chat. Who is in and what everyone does comes from useMinimes. Transparent, recommended
// 1920x360 at the bottom edge of the picture. Parameters: ?demo, ?demo=<n>
import { useMemo, useState } from "react";
import { useMinimes } from "../../../core/hooks/useMinimes.ts";
import { actorStyle, shownVariant, type MinimeAction, type MinimeActor } from "../../../core/minimeBehavior.ts";
import { readMinimeOptions } from "../../../core/minimeFields.ts";
import { params } from "../../../core/params.ts";
import Bear from "../Bear.tsx";
import { BEAR_IDS, type BearId } from "../bears.ts";
import { BEAR_SET, MINIME_REACTION, minimePose } from "../minimeBears.ts";
import { useBears } from "../useBears.ts";
import "../minimes.css";

const DEMO = params.has("demo");
const isBear = (id: string): id is BearId => (BEAR_IDS as readonly string[]).includes(id);

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
  const actors = useMinimes({ catalog, reaction, widthPx });
  const enabled = useMemo(() => readMinimeOptions(values, BEAR_SET).rules.variants?.map(variant => variant.id) ?? [], [values]);
  return (
    <div className={`bb-minimes enter-${values.minimeEnter} exit-${values.minimeExit}`} aria-hidden="true">
      {actors.map(actor => {
        const shown = shownVariant(actor, enabled, values.minimeDefault, DEMO);
        return <Character key={actor.login} actor={actor} bear={[shown, values.minimeDefault].find(isBear) ?? "grizzly"} />;
      })}
    </div>
  );
}

function Character({ actor, bear }: { actor: MinimeActor; bear: BearId }) {
  const values = useBears();
  // Position, movement, duration and facing from the core (actorStyle)
  return (
    <div className={`bb-minime action-${actor.action}`} style={actorStyle(actor)}>
      {values.minimeNames && <span className="bb-minime-name">{actor.user}</span>}
      <div className="bb-minime-body">
        <div className="bb-minime-flip"><Bear bear={bear} pose={minimePose(actor.action)} className="bb-blinking" /></div>
        {actor.action === "sleep" && <span className="bb-minime-zz">{values.sleepText}</span>}
        {actor.action === "selfie" && <span className="bb-minime-flash" />}
      </div>
      <div className="bb-minime-shadow" />
    </div>
  );
}
