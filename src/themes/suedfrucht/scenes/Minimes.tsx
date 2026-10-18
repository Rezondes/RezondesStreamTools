// Minimes of the Südfrucht theme: joined chatters as cartoon fruits with a face that hop across the beach,
// with the name on a wooden sign or a ribbon. Own animations: jumps of joy, pirouette, wobble, sunglasses,
// looking around, sleeping; they react to chat with a juice splash. Who is in and what everyone does comes from
// useMinimes. Transparent, recommended 1920x360 at the bottom edge of the picture. Parameters: ?demo, ?demo=<n>
import { useMemo, useState, type CSSProperties } from "react";
import { useMinimes } from "../../../core/hooks/useMinimes.ts";
import { actorRun, actorStyle, shownVariant, type MinimeAction, type MinimeActor } from "../../../core/minimeBehavior.ts";
import { readMinimeOptions } from "../../../core/minimeFields.ts";
import { hopStyle } from "../../../core/minimeHops.ts";
import { params } from "../../../core/params.ts";
import Fruit from "../Fruit.tsx";
import { FRUIT_SET } from "../fruits.ts";
import { useSuedfrucht } from "../useSuedfrucht.ts";
import "../../../core/minimeHops.css";
import "../minimes.css";

const DEMO = params.has("demo");

export default function Minimes() {
  const values = useSuedfrucht();
  // Width of the scene once on load (OBS source), it stays afterwards
  const [widthPx] = useState(() => innerWidth);
  const catalog = useMemo<MinimeAction[]>(() => [
    { name: "bounce", durationMs: values.bounceMs, weight: values.bounceWeight },
    { name: "spin", durationMs: values.spinMs, weight: values.spinWeight },
    { name: "wobble", durationMs: values.wobbleMs, weight: values.wobbleWeight },
    { name: "sunglasses", durationMs: values.sunglassesMs, weight: values.sunglassesWeight },
    { name: "look", durationMs: values.lookMs, weight: values.lookWeight },
    { name: "sleep", durationMs: values.sleepMs, weight: values.sleepWeight },
  ], [values]);
  const reaction = useMemo<MinimeAction>(() => ({ name: "splash", durationMs: values.splashMs, weight: 0 }), [values.splashMs]);
  const actors = useMinimes({ catalog, reaction, widthPx });
  const enabled = useMemo(() => readMinimeOptions(values, FRUIT_SET).rules.variants?.map(variant => variant.id) ?? [], [values]);
  return (
    <div className={`sf-minimes enter-${values.fruitEnter} exit-${values.fruitExit}`} aria-hidden="true">
      {actors.map(actor => <Character key={actor.login} actor={actor} fruit={shownVariant(actor, enabled, values.fruitDefault, DEMO)} />)}
    </div>
  );
}

function Character({ actor, fruit }: { actor: MinimeActor; fruit: string }) {
  const values = useSuedfrucht();
  // Position, movement, duration and facing from the core (actorStyle), plus the hops of the core (hopStyle)
  const style = { ...actorStyle(actor), ...hopStyle(actor, values.hopMs) } as CSSProperties;
  const run = actorRun(actor);
  return (
    <div className={`sf-minime fruit-${fruit} action-${actor.action}`} style={style}>
      {values.fruitNames && <span className={`sf-minime-name name-${values.fruitNameStyle}`}>{actor.user}</span>}
      <div key={run} className="minime-hop">
        <div className="sf-minime-body">
          <div className="sf-minime-flip"><Fruit id={fruit} faces={values.fruitFaces} /></div>
          {actor.action === "sleep" && <span className="sf-minime-zz">{values.sleepText}</span>}
          {actor.action === "splash" && <Drops count={values.splashDrops} />}
        </div>
      </div>
      <div key={`shadow-${run}`} className="sf-minime-shadow minime-hop-shadow" />
    </div>
  );
}

function Drops({ count }: { count: number }) {
  return (
    <div className="sf-juice">
      {Array.from({ length: count }, (_, index) => <i key={index} style={{ "--i": index, "--n": count } as CSSProperties} />)}
    </div>
  );
}
