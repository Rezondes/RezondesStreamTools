// Alerts of the Bärenbande theme (PLAN-BEARS.md package 13, refs/alert.html): a paper card with the outline and the
// symbol of the alert kind; the chosen bear (or the tower) peeks out from behind it with a spring and reacts with its
// bones (boneMotion.ts: the Grizzly cheers, the Panda startles happily, the Eisbär nods with its thumb up); the symbol
// pops and beats, the tag pops, the name letters fall in, the quote rises; paw prints and leaves fly out of the card
// (confetti.ts); the remaining time as a shrinking outlined bar. With plopp the card squashes, stretches and springs in;
// leaving, the bear ducks away while the card takes the out motion. All on GSAP timelines (stills with ?t=). Texts, quote
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
// The parts of the settings: when they come in (s), the symbol pops in turning and beats like a heart, the tag pops, the
// letters fall in, the quote rises
const partsMotion = (values: BearsValues) => ({
  PARTS_AT: { icon: values.partsAtIcon, tag: values.partsAtTag, line: values.partsAtLine, beat: values.partsAtBeat, quote: values.partsAtQuote },
  POP_ICON: { scale: 0, rotate: values.iconPopTurn, duration: values.iconPopTime, ease: "back.out(3)", transformOrigin: "50% 60%" },
  BEAT: { scale: values.beatScale, duration: values.beatTime, repeat: values.beatRepeat, yoyo: true, ease: "sine.inOut", transformOrigin: "50% 60%" },
  POP_TAG: { scale: 0, rotate: values.tagPopTurn, duration: values.tagPopTime, ease: "back.out(3)" },
  LETTERS: { y: values.lettersFrom, scaleY: values.lettersStretch, opacity: 0, duration: values.lettersTime, ease: "bounce.out", stagger: values.lettersStep },
  RISE: { opacity: 0, y: values.quoteRiseFrom, duration: values.quoteRiseTime },
});
// fixed: the plop of the card from nothing: squash, stretch, spring back (scale x and y, share of fadeDuration)
const PLOP = [{ scaleX: 1.25, scaleY: 0.7, share: 0.35 }, { scaleX: 0.9, scaleY: 1.12, share: 0.25 }, { scaleX: 1.04, scaleY: 0.97, share: 0.2 }, { scaleX: 1, scaleY: 1, share: 0.2 }];
// fixed: leaving, the bear ducks away with this curve (how far down is a setting)
const DUCK_EASE = "back.in(2)";

function describe(alert: Alert, values: BearsValues) {
  return { ...describeAlert(alert, values, KEYS), icon: values[ICONS_BY_KIND[alert.kind]] as IconName, sound: values[ALERT_SOUND_KEYS[alert.kind]] };
}

export default function Alerts() {
  const values = useBears();
  const { current, leaving } = useAlerts(values.alertDuration);
  // The tower has no bones to drive, it blinks with CSS
  const blinking = values.bearAlerts === TOWER && values.blinkEvery > 0;
  return (
    <div className={`bb-alerts bb-facing-${values.facing} ${blinking ? "bb-blinking" : ""}`}>
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
    const { PARTS_AT, POP_ICON, BEAT, POP_TAG, LETTERS, RISE } = partsMotion(values);
    // First on the timeline, so the steps follow each other from 0
    const card = root.querySelector(".bb-alert-card");
    if (card && values.alertIn === "plopp") {
      timeline.set(card, { scaleX: 0, scaleY: 0, transformOrigin: "50% 100%" }, 0);
      for (const step of PLOP) timeline.to(card, { scaleX: step.scaleX, scaleY: step.scaleY, duration: (step.share * values.fadeDuration) / SECOND_MS, ease: "sine.out" });
    }
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
  useTimeline(timeline => {
    const spot = scope.current?.querySelector(".bb-alert-bear");
    if (leaving && spot) timeline.to(spot, { yPercent: values.duckDepth, opacity: 0, duration: values.fadeDuration / SECOND_MS, ease: DUCK_EASE });
  }, [leaving, values.fadeDuration, values.duckDepth], scope);
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
  const throwAt = useBears().partsAtThrow;
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
    timeline.to(clock, { seconds: CONFETTI_LIFE, duration: CONFETTI_LIFE, ease: "none", onUpdate: place }, throwAt);
  }, [count, seed, throwAt], scope);
  return (
    <div ref={scope} className="bb-confetti" aria-hidden="true">
      {confettiAt(seed, count, 0, { x: 0, y: 0 }).map((piece, index) => (
        <div key={index} className="bb-piece"><IconShape name={piece.icon} /></div>
      ))}
    </div>
  );
}
