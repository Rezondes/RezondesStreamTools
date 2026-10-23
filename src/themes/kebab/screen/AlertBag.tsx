// Alert variant "tuete" of the Kebab theme (DESIGN-KEBAB.md "Alerts", prototype refs/alert.html): a paper bag drops in
// and bounces, squashes when it lands (crumbs fly out of its top), the print springs in (arc title, small spit), dish,
// name and line are stamped on one after another, steam rises from the bag. A long name is squeezed to the width of
// the bag. Lines on the kraft paper in the red for text.
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { seedOf } from "../../../core/hash.ts";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import type { SoundValue } from "../../../core/theme.ts";
import type { AlertTexts } from "../alerts.ts";
import { BAG_ARC, BAG_BOX, BAG_TEXT, bagParts } from "../bag.ts";
import ArcTitle from "../ink/ArcTitle.tsx";
import Ink, { type InkStyle } from "../ink/Ink.tsx";
import Burst, { type BurstProps } from "../pixi/Burst.tsx";
import type { KebabValues } from "../settings.ts";
import { playBag } from "../tones.ts";
import { sceneClock } from "../useFrame.ts";

// fixed: the timing of the prototype in s and how the bag moves (px, factors, s)
const AT = { land: 0.42, letters: 0.8, print: 1, texts: 1.4 };
const MOVE = { dropY: -760, drop: 0.7, squashY: 0.92, squashX: 1.05, squash: 0.08, letter: 0.3, letterStagger: 0.04, print: 0.5, printStagger: 0.05, stamp: 0.22, stampScale: 1.5, textStagger: 0.25 };
// fixed: the PixiJS stage around the bag (it reaches above the bag for the steam) and where the top of the bag sits in it
const BURST = { size: { width: 600, height: 760 }, top: { x: 300, y: 237 }, steam: 110 };
const SALT = 4000;

type Props = { texts: AlertTexts; user: string; values: KebabValues; sound: SoundValue | null };

export default function AlertBag({ texts, user, values, sound }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const name = useRef<SVGTextElement>(null);
  const [clock] = useState(sceneClock);
  const [lettered, setLettered] = useState(false);
  const parts = useMemo(() => bagParts(), []);
  const style: InkStyle = { roughness: values.inkRoughness, bowing: values.inkBowing, width: values.inkWidth, seed: values.inkSeed };
  useLayoutEffect(() => {
    const element = name.current;
    if (element && element.getComputedTextLength() > BAG_TEXT.nameWidth) element.setAttribute("textLength", String(BAG_TEXT.nameWidth));
  }, [user]);
  useTimeline(timeline => {
    timeline.from(".kb-bag", { y: MOVE.dropY, duration: MOVE.drop, ease: "bounce.out" }, 0);
    timeline.to(".kb-bag", { scaleY: MOVE.squashY, scaleX: MOVE.squashX, transformOrigin: "50% 100%", duration: MOVE.squash, yoyo: true, repeat: 1 }, AT.land);
    if (sound) timeline.call(() => playBag(sound), [], AT.land);
    if (!lettered) return;
    timeline.from(".kb-bag .kb-arc-letter", { scale: 0, opacity: 0, transformOrigin: "50% 70%", duration: MOVE.letter, ease: "back.out(3)", stagger: MOVE.letterStagger }, AT.letters);
    timeline.from(".kb-bag-print .kb-ink", { drawSVG: "0%", duration: MOVE.print, stagger: MOVE.printStagger }, AT.print);
    timeline.from(".kb-bag-text", { opacity: 0, scale: MOVE.stampScale, transformOrigin: "50% 50%", duration: MOVE.stamp, ease: "power4.in", stagger: MOVE.textStagger }, AT.texts);
  }, [lettered, sound], box);
  const burst: BurstProps = useMemo(() => ({
    clock, size: BURST.size, color: values.redText, seed: seedOf(user) + SALT, count: values.alertCrumbCount,
    hitAt: values.alertCrumbs ? AT.land : null, origin: BURST.top,
    steam: values.steamOn ? { from: BURST.top, height: BURST.steam, color: values.steam } : null,
  }), [clock, values.redText, values.alertCrumbCount, values.alertCrumbs, values.steamOn, values.steam, user]);
  return (
    <div className="kb-alert-bag" ref={box}>
      <div className="kb-alert-burst kb-bag-burst"><Burst {...burst} /></div>
      <svg className="kb-bag" viewBox={`0 0 ${BAG_BOX.width} ${BAG_BOX.height}`}>
        <Ink part={parts.bag} style={style} salt={SALT} />
        <g className="kb-bag-print">
          <ArcTitle text={values.arcText} size={BAG_ARC.size} span={BAG_ARC.span} stroke={values.arcStroke} onReady={() => setLettered(true)} arc={BAG_ARC} />
          <Ink part={parts.print} style={style} salt={SALT + 1} />
        </g>
        <text className="kb-bag-text kb-bag-dish" x={BAG_TEXT.x} y={BAG_TEXT.dish} textAnchor="middle">{`${texts.dish} ${values.alertFor}`}</text>
        <text ref={name} className="kb-bag-text kb-bag-name" x={BAG_TEXT.x} y={BAG_TEXT.name} textAnchor="middle" lengthAdjust="spacingAndGlyphs">{user}</text>
        {texts.line && <text className="kb-bag-text kb-bag-line" x={BAG_TEXT.x} y={BAG_TEXT.line} textAnchor="middle">{texts.line}</text>}
      </svg>
    </div>
  );
}
