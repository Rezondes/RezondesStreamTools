// Minimes of the Kebab theme, transparent, recommended 1920x360 at the bottom edge of the picture: joined chatters as
// small dishes (Döner, Dürüm, Lahmacun, Pommes, chosen with !typ) in red line art that hop along a counter line, with
// the name on a small order note. Own animations: the dish's own move (spin, unroll, fold, throw a stick) and waving;
// on chat they jump with a puff of steam. Towers of the core are a stack of plates. Who is in and what
// everyone does comes from useMinimes, the hopping from the core (minimeHops). Parameters: ?demo, ?demo=<n>
import { type CSSProperties, useMemo, useState } from "react";
import { useMinimes, type MinimeStackScene } from "../../../core/hooks/useMinimes.ts";
import { actorRun, actorStyle, shownVariant, type MinimeAction, type MinimeActor } from "../../../core/minimeBehavior.ts";
import { readMinimeOptions } from "../../../core/minimeFields.ts";
import { hopStyle } from "../../../core/minimeHops.ts";
import { params } from "../../../core/params.ts";
import { DISH_SET, DISH_TYPES, type DishType, MINIME_REACTION } from "../dishes.ts";
import Dish from "../ink/Dish.tsx";
import type { InkStyle } from "../ink/Ink.tsx";
import { plopTone } from "../tones.ts";
import { useKebab } from "../useKebab.ts";
import "../../../core/minimeHops.css";
import "../minimes.css";

const DEMO = params.has("demo");
const STACK: MinimeStackScene = { variants: DISH_SET, sound: plopTone };
// fixed: the level height is a percentage
const PERCENT = 100;
const isDish = (id: string): id is DishType => (DISH_TYPES as readonly string[]).includes(id);

export default function Minimes() {
  const values = useKebab();
  // Width of the scene once on load (OBS source), it stays afterwards
  const [widthPx] = useState(() => innerWidth);
  const catalog = useMemo<MinimeAction[]>(() => [
    { name: "spin", durationMs: values.minimeSpinMs, weight: values.minimeSpinWeight },
    { name: "roll", durationMs: values.minimeRollMs, weight: values.minimeRollWeight },
    { name: "fold", durationMs: values.minimeFoldMs, weight: values.minimeFoldWeight },
    { name: "fries", durationMs: values.minimeFriesMs, weight: values.minimeFriesWeight },
    { name: "wave", durationMs: values.minimeWaveMs, weight: values.minimeWaveWeight },
  ], [values]);
  const reaction = useMemo<MinimeAction>(() => ({ name: MINIME_REACTION, durationMs: values.minimeJumpMs, weight: 0 }), [values.minimeJumpMs]);
  const actors = useMinimes({ catalog, reaction, widthPx, stack: STACK });
  const enabled = useMemo(() => readMinimeOptions(values, DISH_SET).rules.variants?.map(variant => variant.id) ?? [], [values]);
  const style: InkStyle = useMemo(() => ({ roughness: values.inkRoughness, bowing: values.inkBowing, width: values.inkWidth, seed: values.inkSeed }), [values.inkRoughness, values.inkBowing, values.inkWidth, values.inkSeed]);
  return (
    <div className={`kb-minimes${values.minimeCounter ? " kb-on-counter" : ""}`} aria-hidden="true">
      {values.minimeCounter && <div className="kb-minime-counter" />}
      {actors.map(actor => {
        const type = [shownVariant(actor, enabled, values.minimeDefault, DEMO), values.minimeDefault].find(isDish) ?? "doener";
        return <Figure key={actor.login} actor={actor} type={type} style={style} />;
      })}
    </div>
  );
}

// One dish with its note: the core moves the box (walking, hops, towers); in a tower every level stands on the one
// below on a plate, the notes move aside
function Figure({ actor, type, style }: { actor: MinimeActor; type: DishType; style: InkStyle }) {
  const values = useKebab();
  const level = actor.stack ? actor.stack.level - 1 : 0;
  const run = actorRun(actor);
  const css = {
    ...actorStyle(actor), ...hopStyle(actor, values.hopMs),
    "--level-lift": `${(level * values.minimeSize * values.minimeLevelHeight) / PERCENT}px`, "--name-shift": level > 0 ? (-1) ** level : 0,
  } as CSSProperties;
  return (
    <div className={`kb-minime action-${actor.action}`} style={css}>
      {values.minimeLabels && <span className="kb-minime-name">{actor.user}</span>}
      <div key={run} className="minime-hop">
        <div className="kb-minime-flip">
          <Dish type={type} action={actor.action} startedAt={actor.startedAt} durationMs={actor.durationMs} style={style} onPlate={level > 0} />
        </div>
      </div>
    </div>
  );
}
