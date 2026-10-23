// Alerts of the Urlaub theme (PLAN-URLAUB.md package 7, refs/alert.html): a swell runs through from the left (swell.ts,
// PixiJS) and the card rides in on its crest and is set down as the swell passes; the postcard turns to its message
// side, the tag pops, the name letters jump in, the postmark hits with a shake and hibiscus flowers fly; a knot slides
// along the rope as the remaining time; at the end a swell from the right lifts the card and carries it off to the left,
// spray flying where each swell breaks. Styles: postcard, surfboard or message in a bottle. All on one GSAP timeline
// (stills with ?t=). Texts, quote rule and sounds come from the alerts context of the core (src/core/alerts), here keys,
// symbols and the beach look. Parameters: ?sound=0, ?volume=0.5
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
// fixed: when the parts come in (s): settle, flip, tag, letters, line and quote, postmark; the leaving starts this long
// before the end
const AT = { settle: 0.65, flip: 1.1, tag: 1.4, letters: 1.5, words: 1.8, stamp: 2, leaveEarly: 0.4 }; // fixed: see above
// fixed: the card rides in from the left on the crest, low and tilted, and is set down
const RIDE = { x: -560, y: 160, rotateZ: -14, scale: 0.78 };
const PLACED = { y: -30, rotateZ: 4 }; // fixed: where the crest sets it down
const SETTLE = { y: 0, rotateZ: 0, duration: 0.5, ease: "back.out(2)" }; // fixed: the card settles
const FLIP = { rotateY: 180, rotateZ: -2, duration: 0.8, ease: "back.out(1.4)" }; // fixed: the postcard turns over
const STRAIGHT = { rotateZ: 0, duration: 1.2, ease: "elastic.out(1, 0.3)" }; // fixed: and straightens
const POP = { scale: 0, duration: 0.35, ease: "back.out(3)" }; // fixed: the tag pops
const LETTERS = { y: 30, opacity: 0, rotate: -20, duration: 0.4, ease: "back.out(3)", stagger: 0.05 }; // fixed: the letters jump
const RISE = { opacity: 0, y: 10, duration: 0.3, stagger: 0.12 }; // fixed: line and quote rise
const STAMP = { scale: 2.2, opacity: 0, duration: 0.25, ease: "power4.out" }; // fixed: the postmark hits
const SHAKE = { x: 6, duration: 0.05, repeat: 3, yoyo: true }; // fixed: and shakes the card
const LIFT = { y: -40, rotateZ: -6, duration: 0.25, ease: "power2.out" }; // fixed: the outgoing crest lifts the card
const CARRY = { x: -620, y: 180, rotateZ: -28, scale: 0.72, duration: 0.75, ease: "power2.in" }; // fixed: and carries it off
// fixed: where the flowers fly from (top right of the card) in the stage
const FLOWERS = { x: 1120, y: 200 };

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
    leave: values.alertDuration / SECOND_MS - values.alertSwellOut / SECOND_MS - AT.leaveEarly,
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
        {postcard && <b className="ul-alert-name">{alert.user}</b>}
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
