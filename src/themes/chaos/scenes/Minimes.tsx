// Minimes of the Chaos theme, transparent, recommended 1920x360 at the bottom edge of the picture: joined chatters as
// scribble monsters in their color (!color) that hop along the bottom edge, with the name in marker above the head. Own
// animations: wiggle, grin, a scribble star above the head, tumble and get up, sleep with rising scrawls; a spray splat
// in the own color as reaction to chat. Who is in and what everyone does comes from useMinimes, the hopping from the core
// (minimeHops). Parameters: ?demo, ?demo=<n>
import { useMemo, useState, type CSSProperties } from "react";
import { seedOf } from "../../../core/hash.ts";
import { useMinimes } from "../../../core/hooks/useMinimes.ts";
import { actorRun, actorStyle, type MinimeAction, type MinimeActor } from "../../../core/minimeBehavior.ts";
import { hopStyle } from "../../../core/minimeHops.ts";
import "../../../core/minimeHops.css";
import { chance } from "../chance.ts";
import Monster from "../Monster.tsx";
import { splatOf } from "../monsters.ts";
import { scribbleShape } from "../scribbles.ts";
import { useChaos } from "../useChaos.ts";
import "../minimes.css";

export default function Minimes() {
  const values = useChaos();
  // Width of the scene once on load (OBS source), it stays afterwards
  const [widthPx] = useState(() => innerWidth);
  const catalog = useMemo<MinimeAction[]>(() => [
    { name: "wiggle", durationMs: values.minimeWiggleMs, weight: values.minimeWiggleWeight },
    { name: "grin", durationMs: values.minimeGrinMs, weight: values.minimeGrinWeight },
    { name: "star", durationMs: values.minimeStarMs, weight: values.minimeStarWeight },
    { name: "tumble", durationMs: values.minimeTumbleMs, weight: values.minimeTumbleWeight },
    { name: "sleep", durationMs: values.minimeSleepMs, weight: values.minimeSleepWeight },
  ], [values]);
  const reaction = useMemo<MinimeAction>(() => ({ name: "splat", durationMs: values.minimeSplatMs, weight: 0 }), [values.minimeSplatMs]);
  const actors = useMinimes({ catalog, reaction, widthPx });
  return (
    <div className="ch-minimes" aria-hidden="true">
      {actors.map(actor => <Character key={actor.login} actor={actor} />)}
    </div>
  );
}

function Character({ actor }: { actor: MinimeActor }) {
  const values = useChaos();
  // Position, movement, duration and facing from the core (actorStyle), the hops, plus the color of the chatter
  const style = { ...actorStyle(actor), ...hopStyle(actor, values.hopMs), "--minime": actor.color ?? values.minimeDefaultColor } as CSSProperties;
  const run = seedOf(actorRun(actor));
  return (
    <div className={`ch-minime action-${actor.action}`} style={style}>
      {values.minimeNames && <span className="ch-minime-name">{actor.user}</span>}
      <div className="ch-minime-figure">
        {actor.action === "splat" && <Lines className="ch-minime-splat" paths={splatOf(run)} />}
        <div className="minime-hop">
          <div className="ch-minime-flip">
            <div key={actorRun(actor)} className="ch-minime-action">
              <Monster login={actor.login} grin={actor.action === "grin"} jitter={values.jitter} />
            </div>
          </div>
        </div>
        {actor.action === "star" && <Lines className="ch-minime-star" paths={scribbleShape("star", chance(run))} />}
        {actor.action === "sleep" && Array.from({ length: values.minimeSleepScrawls }, (_, index) => (
          <Lines key={index} className="ch-minime-scrawl" paths={scribbleShape("scrawl", chance(run + index))} style={{ "--index": index } as CSSProperties} />
        ))}
      </div>
      <div className="ch-minime-shadow minime-hop-shadow" />
    </div>
  );
}

// A small mark in the unit box of the scribbles (star, scrawl, splat)
function Lines({ className, paths, style }: { className: string; paths: readonly string[]; style?: CSSProperties }) {
  return (
    <svg className={className} viewBox="-0.6 -0.6 1.2 1.2" style={style}>
      {paths.map(path => <path key={path} d={path} />)}
    </svg>
  );
}
