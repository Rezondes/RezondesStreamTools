// Alert variant "bon" of the Kebab theme (DESIGN-KEBAB.md "Alerts", prototype refs/alert.html): the printer drops in,
// the bon is printed step by step (shop, order number, kind, dish, "für", the name in the title font letter by letter,
// the line or the viewer's message, the item), then the stamp hits the paper top right with onion rings and meat curls
// and the bon shakes. The stamp is part of the paper, so it falls and fades with the bon when the alert leaves.
import { useMemo, useRef, useState } from "react";
import { seedOf } from "../../../core/hash.ts";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import type { SoundValue } from "../../../core/theme.ts";
import type { AlertTexts } from "../alerts.ts";
import Burst, { type BurstProps } from "../pixi/Burst.tsx";
import type { KebabValues } from "../settings.ts";
import { playPrinter, playStamp } from "../tones.ts";
import { sceneClock } from "../useFrame.ts";
import Stamp from "./Stamp.tsx";

// fixed: the timing of the prototype in s (printer, bon, name) and how the parts move (px, s, steps of the shake)
const AT = { printer: 0, bon: 0.5, printed: 1.5 };
const MOVE = { printerY: -220, printer: 0.45, feed: 1, letterY: 20, letter: 0.35, letterStagger: 0.05, hit: 0.18, hitScale: 2.6, shake: 6, shakeTime: 0.04, shakes: 3 };
const SECOND_MS = 1000;
// fixed: the PixiJS stage of the crumbs around the stamp: its size and where the stamp sits in it (px)
const BURST = { size: { width: 800, height: 700 }, origin: { x: 400, y: 350 } };

type Props = { texts: AlertTexts; user: string; shop: string; values: KebabValues; sound: SoundValue | null };

export default function AlertBon({ texts, user, shop, values, sound }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [clock] = useState(sceneClock);
  const stampAt = values.alertStampAt / SECOND_MS;
  useTimeline(timeline => {
    timeline.from(".kb-printer", { y: MOVE.printerY, duration: MOVE.printer, ease: "back.out(1.7)" }, AT.printer);
    timeline.from(".kb-bon", { clipPath: "inset(0% 0% 100% 0%)", duration: MOVE.feed, ease: `steps(${values.alertPrintSteps})` }, AT.bon);
    timeline.set(".kb-bon", { clipPath: "none" }, AT.printed);
    timeline.from(".kb-alert-name span", { scale: 0, y: MOVE.letterY, duration: MOVE.letter, ease: "back.out(3)", stagger: MOVE.letterStagger }, AT.printed);
    if (sound) timeline.call(() => playPrinter(sound), [], AT.bon);
    if (!values.alertStamp) return;
    timeline.from(".kb-stamp", { scale: MOVE.hitScale, opacity: 0, duration: MOVE.hit, ease: "power4.in" }, stampAt);
    timeline.to(".kb-bon", { x: MOVE.shake, duration: MOVE.shakeTime, yoyo: true, repeat: MOVE.shakes }, stampAt + MOVE.hit);
    if (sound) timeline.call(() => playStamp(sound), [], stampAt);
  }, [values.alertPrintSteps, values.alertStamp, stampAt, sound], box);
  const burst: BurstProps = useMemo(() => ({
    clock, size: BURST.size, color: values.red, seed: seedOf(user), count: values.alertCrumbCount,
    hitAt: values.alertStamp && values.alertCrumbs ? stampAt + MOVE.hit : null, origin: BURST.origin, steam: null,
  }), [clock, values.red, values.alertCrumbCount, values.alertStamp, values.alertCrumbs, stampAt, user]);
  return (
    <div className="kb-bon-box kb-alert-bon" ref={box}>
      <div className="kb-printer" />
      <div className="kb-bon">
        <div className="kb-bon-shop">{shop}</div>
        <div className="kb-bon-number">{texts.number}</div>
        <hr />
        <div className="kb-alert-kind">{texts.tag}</div>
        <div className="kb-alert-dish">{texts.dish}</div>
        <div className="kb-alert-for">{values.alertFor}</div>
        <div className="kb-alert-name">{[...user].map((char, index) => <span key={index}>{char}</span>)}</div>
        {texts.line && <div className="kb-alert-line">{texts.line}</div>}
        {texts.item && <><hr /><div className="kb-bon-item"><span>{texts.item.label}</span><small>{texts.item.note}</small></div></>}
        {values.alertStamp && <Stamp text={values.alertStampText} />}
        <div className="kb-zigzag" />
      </div>
      {burst.hitAt !== null && <div className="kb-alert-burst"><Burst {...burst} /></div>}
    </div>
  );
}
