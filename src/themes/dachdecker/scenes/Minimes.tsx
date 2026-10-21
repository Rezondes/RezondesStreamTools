// Minimes of the Dachdecker theme, transparent, recommended 1920x360 at the bottom edge of the picture: joined chatters
// as small 3D blueprint workers (Dachdecker, Zimmerer, Spengler, Azubi, Polier) on a ridge strip, with the name as a plan
// label. Own animations: hammer, measure, carry (the Azubi stumbles), show the plan, wave, snack; on chat they tip the
// helmet. Towers of the core stand as a scaffold on each other's shoulders. Who is in and what everyone does comes from
// useMinimes; the core moves an anchor per figure with CSS (walking, hops, towers), the 3D figure follows it.
// Parameters: ?demo, ?demo=<n>
import { type CSSProperties, type RefObject, useMemo, useRef, useState } from "react";
import { useAnchors } from "../../../core/hooks/useAnchors.ts";
import { useMinimes, type MinimeStackScene } from "../../../core/hooks/useMinimes.ts";
import { actorRun, actorStyle, shownVariant, type MinimeAction, type MinimeActor } from "../../../core/minimeBehavior.ts";
import { readMinimeOptions } from "../../../core/minimeFields.ts";
import { hopStyle } from "../../../core/minimeHops.ts";
import { params } from "../../../core/params.ts";
import type { DachdeckerValues } from "../../../generated/themes/dachdecker.ts";
import FigureStage from "../../../core/three/FigureStage.tsx";
import PartFigure, { type FigureRun } from "../../../core/three/PartFigure.tsx";
import { figure, FIGURE_SET, FIGURE_TYPES, type FigureType, pose } from "../figures.ts";
import { useDachdecker } from "../useDachdecker.ts";
import "../../../core/minimeHops.css";
import "../minimes.css";

const DEMO = params.has("demo");
const STACK: MinimeStackScene = { variants: FIGURE_SET };
// Core actions in which the figure walks
const WALKING = new Set(["walk", "approach", "gather", "stackWalk", "dismount"]);
const HELMETS = {
  dachdecker: "helmetDachdecker", zimmerer: "helmetZimmerer", spengler: "helmetSpengler", azubi: "helmetAzubi", polier: "helmetPolier",
} as const satisfies Record<FigureType, keyof DachdeckerValues>;
const PARTS = Object.fromEntries(FIGURE_TYPES.map(type => [type, figure(type)])) as Record<FigureType, ReturnType<typeof figure>>;
const isType = (id: string): id is FigureType => (FIGURE_TYPES as readonly string[]).includes(id);

function runOf(actor: MinimeActor, type: FigureType, stumble: boolean): FigureRun {
  const carry = type === "azubi" && stumble ? "carryStumble" : "carry";
  const animation = WALKING.has(actor.action) ? "walk" : actor.action === "carry" ? carry : actor.action;
  return { animation, startedAt: actor.startedAt, durationMs: actor.durationMs, facing: actor.facing };
}

export default function Minimes() {
  const values = useDachdecker();
  // Width of the scene once on load (OBS source), it stays afterwards
  const [widthPx] = useState(() => innerWidth);
  const catalog = useMemo<MinimeAction[]>(() => [
    { name: "hammer", durationMs: values.minimeHammerMs, weight: values.minimeHammerWeight },
    { name: "measure", durationMs: values.minimeMeasureMs, weight: values.minimeMeasureWeight },
    { name: "carry", durationMs: values.minimeCarryMs, weight: values.minimeCarryWeight },
    { name: "plan", durationMs: values.minimePlanMs, weight: values.minimePlanWeight },
    { name: "wave", durationMs: values.minimeWaveMs, weight: values.minimeWaveWeight },
    { name: "snack", durationMs: values.minimeSnackMs, weight: values.minimeSnackWeight },
  ], [values]);
  const reaction = useMemo<MinimeAction>(() => ({ name: "tip", durationMs: values.minimeTipMs, weight: 0 }), [values.minimeTipMs]);
  const actors = useMinimes({ catalog, reaction, widthPx, stack: STACK });
  const enabled = useMemo(() => readMinimeOptions(values, FIGURE_SET).rules.variants?.map(variant => variant.id) ?? [], [values]);
  const stage = useRef<HTMLDivElement>(null);
  const anchorOf = useAnchors();
  const shown = actors.map(actor => ({ actor, type: [shownVariant(actor, enabled, values.minimeDefault, DEMO), values.minimeDefault].find(isType) ?? "dachdecker" }));
  return (
    <div ref={stage} className={`dd-minimes${values.minimeRidge ? " dd-on-ridge" : ""}`} aria-hidden="true">
      {values.minimeRidge && <div className="dd-minime-ridge" />}
      {shown.map(({ actor }) => <Anchor key={actor.login} actor={actor} anchor={anchorOf(actor.login)} />)}
      <FigureStage className="dd-minime-canvas" level={values.quality} light={values.line}>
        {shown.map(({ actor, type }) => (
          <PartFigure
            key={actor.login}
            parts={PARTS[type]}
            pose={pose}
            looks={{
              skin: values.minimeSkin, shirt: values.minimeShirt, pants: values.minimePants, boots: values.minimeBoots, metal: values.slateDark,
              helmet: values[HELMETS[type]], tool: values.copper, tile: values.accent, paper: values.line,
            }}
            run={runOf(actor, type, values.minimeStumble)}
            anchor={anchorOf(actor.login)}
            stage={stage}
          />
        ))}
      </FigureStage>
    </div>
  );
}

// The box the core moves: position, hops, level in a tower; the name label sits above it
function Anchor({ actor, anchor }: { actor: MinimeActor; anchor: RefObject<HTMLDivElement | null> }) {
  const values = useDachdecker();
  const level = actor.stack ? actor.stack.level - 1 : 0;
  const style = { ...actorStyle(actor), ...hopStyle(actor, values.hopMs), "--level": level, "--name-shift": level > 0 ? (-1) ** level : 0 } as CSSProperties;
  return (
    <div className={`dd-minime action-${actor.action}`} style={style}>
      {values.minimeLabels && <span className="dd-minime-name">{actor.user}</span>}
      <div key={actorRun(actor)} className="minime-hop"><div className="dd-minime-anchor" ref={anchor} /></div>
    </div>
  );
}
