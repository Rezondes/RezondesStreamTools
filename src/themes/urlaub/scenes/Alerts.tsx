// Alerts of the Urlaub theme (PLAN-URLAUB.md package 7, refs/alert.html): a swell runs through from the left (swell.ts,
// PixiJS) and the card rides in on its crest and is set down as the swell passes; the postcard turns to its message
// side, the tag pops, the name letters jump in, the postmark hits with a shake and hibiscus flowers fly; a knot slides
// along the rope as the remaining time; at the end a swell from the right lifts the card and carries it off to the left,
// spray flying where each swell breaks. Styles: postcard, surfboard or message in a bottle. All on one GSAP timeline
// (stills with ?t=). Texts, quote rule and sounds come from the alerts context of the core (src/core/alerts), here keys,
// symbols and the beach look. Parameters: ?sound=0, ?volume=0.5
import { useOneLine } from "../../../core/hooks/useOneLine.ts";
import { SplitText } from "gsap/SplitText";
import type { Application } from "pixi.js";
import { Graphics } from "pixi.js";
import { type RefObject, useRef } from "react";
import { ALERT_SOUND_KEYS, alertQuote, alertTextKeys, describeAlert } from "../../../core/alerts/alerts.ts";
import { useAlertSounds } from "../../../core/alerts/useAlertSounds.ts";
import { useAlerts } from "../../../core/hooks/useAlerts.ts";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import PixiStage from "../../../core/pixi/PixiStage.tsx";
import { fillTemplate } from "../../../core/template.ts";
import type { Alert, AlertKind } from "../../../core/types.ts";
import { ICONS, type IconName } from "../beach.ts";
import Postcard from "../cards/Postcard.tsx";
import { drawPetals } from "../pixi/Petals.tsx";
import { drawSpray, drawSwell } from "../pixi/Swell.tsx";
import type { UrlaubValues } from "../settings.ts";
import ShapeIcon from "../ShapeIcon.tsx";
import { MIDDLE, STRETCH, type SwellTiming } from "../swell.ts";
import { playChime, playLeave } from "../tones.ts";
import { useUrlaub } from "../useUrlaub.ts";

type Key = keyof UrlaubValues;
const KEYS = alertTextKeys("Tag");
// Urlaub-specific: symbol on the stamp per alert kind
const ICONS_BY_KIND = {
  follow: "followIcon", sub: "subIcon", resub: "resubIcon", gift: "giftIcon", raid: "raidIcon", cheer: "cheerIcon", redeem: "redeemIcon", hype: "hypeIcon",
} as const satisfies Record<AlertKind, Key>;

const SECOND_MS = 1000; // fixed: seconds in ms
// The motion of the settings: when the parts come in (s), the ride in on the crest, the flip, the pops, the postmark and
// the ride out; the leaving starts leaveEarly s before the end
const cardMotion = (values: UrlaubValues) => ({
  AT: { flip: values.atFlip, tag: values.atTag, letters: values.atLetters, words: values.atQuote, stamp: values.atStamp, leaveEarly: values.leaveEarly },
  RIDE: { x: values.rideX, y: values.rideY, rotateZ: values.rideTurn, scale: values.rideScale },
  PLACED: { y: values.placedY, rotateZ: values.placedTurn },
  SETTLE: { y: 0, rotateZ: 0, duration: values.settleTime, ease: "back.out(2)" },
  FLIP: { rotateY: 180, rotateZ: values.flipTurn, duration: values.flipTime, ease: "back.out(1.4)" }, // fixed: a half turn shows the back
  STRAIGHT: { rotateZ: 0, duration: values.straightTime, ease: "elastic.out(1, 0.3)" },
  POP: { scale: 0, duration: values.tagPop, ease: "back.out(3)" },
  LETTERS: { y: values.lettersFrom, opacity: 0, rotate: values.lettersTurn, duration: values.lettersTime, ease: "back.out(3)", stagger: values.lettersStep },
  RISE: { opacity: 0, y: values.quoteFrom, duration: values.quoteTime, stagger: values.quoteStep },
  STAMP: { scale: values.stampFrom, opacity: 0, duration: values.stampTime, ease: "power4.out" },
  SHAKE: { x: values.shakeX, duration: values.shakeTime, repeat: values.shakeRepeat, yoyo: true },
  LIFT: { y: values.liftY, rotateZ: values.liftTurn, duration: values.liftTime, ease: "power2.out" },
  CARRY: { x: values.carryX, y: values.carryY, rotateZ: values.carryTurn, scale: values.carryScale, duration: values.carryTime, ease: "power2.in" },
  FLOWERS: { x: values.flowersX, y: values.flowersY },
});

function describe(alert: Alert, values: UrlaubValues) {
  return { ...describeAlert(alert, values, KEYS), icon: values[ICONS_BY_KIND[alert.kind]] as IconName, sound: values[ALERT_SOUND_KEYS[alert.kind]] };
}

export default function Alerts() {
  const values = useUrlaub();
  const { current, leaving } = useAlerts(values.alertDuration);
  return (
    <div className={`ul-alerts ul-surfed`}>
      {current && <Card key={current.key} alert={current} leaving={leaving} />}
    </div>
  );
}

// The timeline of a card: the clock of the swell, the ride in on the crest, the flip, the pops, the postmark, the ride out
function useCardTimeline(scope: RefObject<HTMLDivElement | null>, clock: { time: number }, timing: SwellTiming, deps: readonly unknown[]) {
  const { AT, RIDE, PLACED, SETTLE, FLIP, STRAIGHT, POP, LETTERS, RISE, STAMP, SHAKE, LIFT, CARRY } = cardMotion(useUrlaub());
  useTimeline(timeline => {
    const root = scope.current;
    const card = root?.querySelector(".ul-alert");
    if (!root || !card) return;
    clock.time = 0;
    timeline.to(clock, { time: timing.leave + timing.outSeconds + 1, duration: timing.leave + timing.outSeconds + 1, ease: "none" }, 0);
    // In on the crest: the card reaches its place when the crest reaches the middle of the stretch
    const ride = timing.inSeconds * ((MIDDLE - STRETCH.from) / (STRETCH.to - STRETCH.from));
    timeline.fromTo(card, RIDE, { x: 0, ...PLACED, scale: 1, duration: ride, ease: "none" }, 0).to(card, SETTLE, ride);
    const turn = root.querySelector(".ul-postcard");
    if (turn) timeline.to(turn, FLIP, AT.flip).to(turn, STRAIGHT, AT.flip + FLIP.duration);
    timeline.from(root.querySelector(".ul-tag"), POP, AT.tag);
    const name = root.querySelector(".ul-alert-name") ?? root.querySelector(".ul-alert-line");
    if (name) timeline.from(SplitText.create(name, { type: "words,chars" }).chars, LETTERS, AT.letters);
    const words = root.querySelector(".ul-quote");
    if (words) timeline.from(words, RISE, AT.words);
    const mark = root.querySelector(".ul-postmark");
    if (mark) timeline.from(mark, STAMP, AT.stamp).to(card, SHAKE, AT.stamp + STAMP.duration);
    // Out: the crest from the right reaches the card, lifts it and carries it off
    const reached = timing.leave + timing.outSeconds * ((STRETCH.to - MIDDLE) / (STRETCH.to - STRETCH.from));
    timeline.to(card, LIFT, reached - LIFT.duration).to(card, CARRY, reached);
  }, deps, scope);
}

// The PixiJS layer of a card: the swell, the spray of its breaks and the flowers, drawn every frame from the clock
function swellPainter(clock: { time: number }, timing: SwellTiming, values: UrlaubValues) {
  return (app: Application) => {
    const [water, spray, flowers] = [new Graphics(), new Graphics(), new Graphics()];
    app.stage.addChild(water, spray, flowers);
    const breaks = [timing.inSeconds * 0.5, timing.leave + timing.outSeconds * 0.5];
    const { AT, FLOWERS } = cardMotion(values);
    const paint = () => {
      const seconds = clock.time;
      drawSwell(water, seconds, timing, { sea: values.sea, deep: values.seaDeep, foam: values.foam });
      drawSpray(spray, seconds, values.splash ? breaks : [], values.alertSpray, values.foam);
      drawPetals(flowers, values.petals ? seconds - AT.stamp : -1, values.petalCount, FLOWERS, { flower: values.accent, other: values.accent2, middle: values.sun });
    };
    paint();
    app.ticker.add(paint);
    return () => app.ticker.remove(paint);
  };
}

function Card({ alert, leaving }: { alert: Alert; leaving: boolean }) {
  // The name stays on one line on the card
  const nameLine = useOneLine<HTMLElement>(alert.user);
  const values = useUrlaub();
  const scope = useRef<HTMLDivElement>(null);
  const { tag, line, icon, sound } = describe(alert, values);
  const closing = values.soundLeave;
  useAlertSounds(values.alertSound ? () => playChime(sound) : null, values.alertSound ? () => playLeave(closing) : null, leaving);
  const said = values.alertQuote ? alertQuote(alert) : null;
  const quote = said ? fillTemplate(values.quoteFormat, { text: said }) : "";
  const postcard = values.alertStyle === "postkarte";
  const timing: SwellTiming = {
    inSeconds: values.alertSwellIn / SECOND_MS,
    outSeconds: values.alertSwellOut / SECOND_MS,
    leave: values.alertDuration / SECOND_MS - values.alertSwellOut / SECOND_MS - values.leaveEarly,
    height: values.alertSwellHeight,
  };
  const clock = useRef({ time: 0 });
  useCardTimeline(scope, clock.current, timing, [values, alert]);
  const draw = swellPainter(clock.current, timing, values);
  const back = (
    <div className="ul-alert-body">
      <div className="ul-stamp"><ShapeIcon shape={ICONS[icon]} /></div>
      <div className="ul-alert-text">
        <span className="ul-tag">{tag}</span>
        {postcard && <b ref={nameLine} className="ul-alert-name">{alert.user}</b>}
        <b className="ul-alert-line">{line}</b>
        {quote && <i className="ul-quote">{quote}</i>}
      </div>
      {postcard && (
        <div className="ul-address">
          {fillTemplate(values.alertAddress, { channel: values.channelName }).split("/").map((row, index) => <i key={index}>{row.trim()}</i>)}
        </div>
      )}
      {postcard && <span className="ul-postmark">{fillTemplate(values.alertStamp, { date: new Date().toLocaleDateString(values.locale, { day: "2-digit", month: "2-digit" }) })}</span>}
    </div>
  );
  return (
    <div ref={scope} className="ul-alert-scene">
      <div className={`ul-alert ul-alert-${values.alertStyle}`}>
        {values.alertStyle === "flaschenpost" && <div className="ul-bottle" aria-hidden="true" />}
        {postcard ? <Postcard greeting={values.alertGreeting}>{back}</Postcard> : back}
        {values.alertTimer && <div className="ul-rope" aria-hidden="true"><i className="ul-knot" /></div>}
      </div>
      <PixiStage background={null} onReady={draw} className="ul-swell" />
    </div>
  );
}
