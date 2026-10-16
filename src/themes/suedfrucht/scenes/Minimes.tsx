// Minimes des Südfrucht-Themes: eingeklinkte Chatter als Cartoon-Früchte mit Gesicht, die über den Strand hüpfen,
// mit Namen auf einem Holzschild oder Band. Eigene Animationen: Freudensprünge, Pirouette, Wackeln, Sonnenbrille,
// Umschauen, Schlafen; auf Chat reagieren sie mit einem Saftspritzer. Wer drin ist und was jeder tut, kommt aus
// useMinimes. Transparent, empfohlen 1920x360 am unteren Bildrand. Parameter: ?demo, ?demo=<n>
import { useMemo, useState, type CSSProperties } from "react";
import { useMinimes } from "../../../core/hooks/useMinimes.ts";
import { actorRun, actorStyle, shownVariant, type MinimeAction, type MinimeActor } from "../../../core/minimeBehavior.ts";
import { readMinimeOptions } from "../../../core/minimeFields.ts";
import { params } from "../../../core/params.ts";
import Fruit from "../Fruit.tsx";
import { FRUIT_SET } from "../fruits.ts";
import { hopPlan } from "../hops.ts";
import { useSuedfrucht } from "../useSuedfrucht.ts";
import "../minimes.css";

const DEMO = params.has("demo");

export default function Minimes() {
  const values = useSuedfrucht();
  // Breite der Szene einmal beim Laden (OBS-Quelle), danach bleibt sie
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
  const hops = hopPlan(actor.durationMs, values.hopMs);
  // Lage, Bewegung, Dauer und Blickrichtung aus dem Kern (actorStyle), dazu die Sprünge der Frucht
  const style = { ...actorStyle(actor), "--hops": hops.count, "--hop-ms": `${hops.periodMs}ms` } as CSSProperties;
  const run = actorRun(actor);
  return (
    <div className={`sf-minime fruit-${fruit} action-${actor.action}`} style={style}>
      {values.fruitNames && <span className={`sf-minime-name name-${values.fruitNameStyle}`}>{actor.user}</span>}
      <div key={run} className="sf-minime-body">
        <div className="sf-minime-flip"><Fruit id={fruit} faces={values.fruitFaces} /></div>
        {actor.action === "sleep" && <span className="sf-minime-zz">{values.sleepText}</span>}
        {actor.action === "splash" && <Drops count={values.splashDrops} />}
      </div>
      <div key={`shadow-${run}`} className="sf-minime-shadow" />
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
