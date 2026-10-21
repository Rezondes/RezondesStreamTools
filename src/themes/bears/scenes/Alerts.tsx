// Alerts of the Bärenbande theme (PLAN-BEARS.md package 13, refs/alert.html): a paper card with the outline and the
// symbol of the alert kind; the chosen bear (or the tower) peeks out from behind it with a spring and reacts with its
// bones (boneMotion.ts: the Grizzly cheers, the Panda startles happily, the Eisbär nods with its thumb up); the symbol
// pops and beats, the tag pops, the name letters fall in, the quote rises; paw prints and leaves fly out of the card
// (confetti.ts); the remaining time as a shrinking outlined bar. All on GSAP timelines (stills with ?t=). Texts, quote
// rule and sounds come from the alerts context of the core (src/core/alerts), here keys, symbols and the look.
// Parameters: ?sound=0, ?volume=0.5
import { SplitText } from "gsap/SplitText";
import { useRef } from "react";
import { ALERT_SOUND_KEYS, alertQuote, alertTextKeys, describeAlert } from "../../../core/alerts/alerts.ts";
import { useAlertSounds } from "../../../core/alerts/useAlertSounds.ts";
import { seedOf } from "../../../core/hash.ts";
import { useAlerts } from "../../../core/hooks/useAlerts.ts";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import { fillTemplate } from "../../../core/template.ts";
import type { Alert, AlertKind } from "../../../core/types.ts";
import { bearDriver } from "../Bear.tsx";
import { isBearChoice, TOWER, type BearId } from "../bears.ts";
import { alertMotion, type Reaction } from "../boneMotion.ts";
import { CONFETTI_LIFE, confettiAt } from "../confetti.ts";
import type { PoseName } from "../rig.ts";
import Hero from "../Hero.tsx";
import type { IconName } from "../icons.ts";
import IconShape from "../IconShape.tsx";
import type { BearsValues } from "../settings.ts";
import { playChime, playLeave } from "../tones.ts";
import { useBears } from "../useBears.ts";

type Key = keyof BearsValues;
const KEYS = alertTextKeys("Tag");
// Symbol on the card per alert kind
const ICONS_BY_KIND = {
  follow: "followIcon", sub: "subIcon", resub: "resubIcon", gift: "giftIcon", raid: "raidIcon", cheer: "cheerIcon", redeem: "redeemIcon", hype: "hypeIcon",
} as const satisfies Record<AlertKind, Key>;
// How every bear reacts to an alert: its pose and its move
const POSES: Record<BearId, PoseName> = { eisbaer: "thumbs", grizzly: "cheer", panda: "cheer" };
const REACTIONS: Record<BearId, Reaction> = { eisbaer: "nod", grizzly: "cheer", panda: "startle" };

// fixed: how long the timeline of the bear runs (s)
const RUN = 60 * 60;
const SECOND_MS = 1000; // fixed: seconds in ms
const PERCENT = 100; // fixed: settings in percent to shares
// fixed: when the parts come in (s): the throw of the confetti, the symbol, the tag, the name letters, its beat, the quote
const PARTS_AT = { throw: 0.3, icon: 0.35, tag: 0.45, line: 0.55, beat: 1, quote: 1 };
// fixed: the symbol pops in turning and beats like a heart, the tag pops, the letters fall in, the quote rises
const POP_ICON = { scale: 0, rotate: -30, duration: 0.5, ease: "back.out(3)", transformOrigin: "50% 60%" };
const BEAT = { scale: 1.12, duration: 0.22, repeat: 9, yoyo: true, ease: "sine.inOut", transformOrigin: "50% 60%" }; // fixed: see above
const POP_TAG = { scale: 0, rotate: 10, duration: 0.4, ease: "back.out(3)" }; // fixed: see above
const LETTERS = { y: -50, scaleY: 1.5, opacity: 0, duration: 0.45, ease: "bounce.out", stagger: 0.04 }; // fixed: see above
const RISE = { opacity: 0, y: 10, duration: 0.3 }; // fixed: see above

function describe(alert: Alert, values: BearsValues) {
  return { ...describeAlert(alert, values, KEYS), icon: values[ICONS_BY_KIND[alert.kind]] as IconName, sound: values[ALERT_SOUND_KEYS[alert.kind]] };
}

export default function Alerts() {
  const values = useBears();
  const { current, leaving } = useAlerts(values.alertDuration);
  // The tower has no bones to drive, it blinks with CSS
  const blinking = values.bearAlerts === TOWER && values.blinkEvery > 0;
  return (
    <div className={`bb-alerts align-${values.alertAlign} bb-facing-${values.facing} ${blinking ? "bb-blinking" : ""}`}>
      {current && <Card key={current.key} alert={current} leaving={leaving} />}
      {current && values.confetti && <Confetti key={`confetti-${current.key}`} count={values.confettiCount} seed={seedOf(String(current.key))} />}
    </div>
  );
}

function Card({ alert, leaving }: { alert: Alert; leaving: boolean }) {
  const values = useBears();
  const scope = useRef<HTMLDivElement>(null);
  const { tag, line, icon, sound } = describe(alert, values);
  const closing = values.soundLeave;
  useAlertSounds(values.alertSound ? () => playChime(sound) : null, values.alertSound ? () => playLeave(closing) : null, leaving);
  const said = values.alertQuote ? alertQuote(alert) : null;
  const quote = said ? fillTemplate(values.quoteFormat, { text: said }) : "";
  useTimeline(timeline => {
    const root = scope.current;
    if (!root) return;
    const symbol = root.querySelector(".bb-alert-icon");
    if (symbol) timeline.from(symbol, POP_ICON, PARTS_AT.icon).to(symbol, BEAT, PARTS_AT.beat);
    timeline.from(root.querySelector(".bb-tag"), POP_TAG, PARTS_AT.tag);
    const name = root.querySelector(".bb-alert-line");
    if (name) timeline.from(SplitText.create(name, { type: "words,chars" }).chars, LETTERS, PARTS_AT.line);
    const words = root.querySelector(".bb-quote");
    if (words) timeline.from(words, RISE, PARTS_AT.quote);
    // The bear peeks out and reacts
    const spot = root.querySelector<HTMLElement>(".bb-alert-bear");
    const svg = spot?.querySelector<SVGSVGElement>("svg.bb-hero");
    const bear = isBearChoice(values.bearAlerts) && values.bearAlerts !== TOWER ? values.bearAlerts : null;
    const drive = svg && bear ? bearDriver(svg, bear, POSES[bear]) : null;
    const motion = { blinkEvery: values.blinkEvery / SECOND_MS, breathe: values.breathe, breathAmount: values.breathAmount / PERCENT, breathSeconds: values.breatheMs / SECOND_MS };
    const clock = { seconds: 0 };
    const place = () => {
      const frame = alertMotion(clock.seconds, bear ? REACTIONS[bear] : "cheer", motion);
      if (spot) spot.style.translate = `${frame.body.x}px 0`;
      drive?.(frame);
    };
    place();
    timeline.to(clock, { seconds: RUN, duration: RUN, ease: "none", onUpdate: place }, 0);
  }, [values, alert], scope);
  return (
    <div ref={scope} className={`bb-alert in-${values.alertIn} out-${values.alertOut}${leaving ? " leaving" : ""}`}>
      <div className="bb-alert-bear"><Hero choice={values.bearAlerts} poses={POSES} className="bb-hero" /></div>
      <div className="bb-alert-card bb-card">
        <div className="bb-alert-icon"><IconShape name={icon} /></div>
        <div className="bb-alert-text">
          <span className="bb-tag bb-pill">{tag}</span>
          <b className="bb-alert-line">{line}</b>
          {quote && <i className="bb-quote">{quote}</i>}
        </div>
        {values.alertTimer && <div className="bb-timer" aria-hidden="true"><span /></div>}
      </div>
    </div>
  );
}

// Paw prints and leaves thrown up out of the top of the card, placed every frame from the time since the throw
function Confetti({ count, seed }: { count: number; seed: number }) {
  const scope = useRef<HTMLDivElement>(null);
  useTimeline(timeline => {
    const root = scope.current;
    if (!root) return;
    const card = root.parentElement?.querySelector(".bb-alert-card")?.getBoundingClientRect();
    const area = root.getBoundingClientRect();
    const origin = card ? { x: card.left + card.width * 0.5 - area.left, y: card.top - area.top } : { x: area.width * 0.5, y: 0 };
    const nodes = [...root.children] as HTMLElement[];
    const clock = { seconds: 0 };
    const place = () => confettiAt(seed, count, clock.seconds, origin).forEach((piece, index) => {
      nodes[index].style.transform = `translate(${piece.x}px, ${piece.y}px) rotate(${piece.rotation}deg)`;
      nodes[index].style.opacity = String(piece.alpha);
    });
    place();
    timeline.to(clock, { seconds: CONFETTI_LIFE, duration: CONFETTI_LIFE, ease: "none", onUpdate: place }, PARTS_AT.throw);
  }, [count, seed], scope);
  return (
    <div ref={scope} className="bb-confetti" aria-hidden="true">
      {confettiAt(seed, count, 0, { x: 0, y: 0 }).map((piece, index) => (
        <div key={index} className="bb-piece"><IconShape name={piece.icon} /></div>
      ))}
    </div>
  );
}
