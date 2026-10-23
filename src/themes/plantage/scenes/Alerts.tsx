// Alerts of the Plantage theme (PLAN-PLANTAGE.md package 4, refs/alert.html): a glossy mango falls onto a paper
// medallion, squashes and springs back, juice and leaves burst out (pixi/AlertBurst.tsx); the frosted card grows out of
// the medallion, the name pops letter by letter, header, line and quote follow (GSAP); the branch under the card is the
// remaining time and loses its leaves. Leaving: the card shrinks back, the mango rolls away, the medallion pops out.
// The text keeps the set gap to the medallion. Texts, quote rule and sounds come from the alerts context of the core
// (src/core/alerts). Transparent. Parameters: ?sound=0, ?volume=0.5, ?t=<s> (still of the entrance)
import { SplitText } from "gsap/SplitText";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { ALERT_SOUND_KEYS, alertQuote, alertTextKeys, describeAlert } from "../../../core/alerts/alerts.ts";
import { useAlertSounds } from "../../../core/alerts/useAlertSounds.ts";
import { seedOf } from "../../../core/hash.ts";
import { useAlerts } from "../../../core/hooks/useAlerts.ts";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import { fillTemplate } from "../../../core/template.ts";
import type { Alert, AlertKind } from "../../../core/types.ts";
import Branch from "../cards/Branch.tsx";
import Medallion from "../cards/Medallion.tsx";
import type { IconName } from "../field.ts";
import { alertLayout, BURST_CANVAS, MEDAL } from "../mangoDrop.ts";
import AlertBurst from "../pixi/AlertBurst.tsx";
import type { PlantageValues } from "../settings.ts";
import { playChime, playLeave } from "../tones.ts";
import { usePlantage } from "../usePlantage.ts";

type Key = keyof PlantageValues;
const KEYS = alertTextKeys("Tag");
// Plantage-specific: symbol in the medallion per alert kind when no mango falls
const ICONS_BY_KIND = {
  follow: "followIcon", sub: "subIcon", resub: "resubIcon", gift: "giftIcon", raid: "raidIcon", cheer: "cheerIcon", redeem: "redeemIcon", hype: "hypeIcon",
} as const satisfies Record<AlertKind, Key>;

// fixed: the entrance in s, like the prototype
const ENTER = { medal: 0.3, card: 0.8, name: 1.0, branch: 1.0, line: 1.4, quote: 1.6 };
// fixed: how far the name letters and the text lines rise in px, like the prototype
const RISE = { name: 50, text: 12 };

function describe(alert: Alert, values: PlantageValues) {
  return { ...describeAlert(alert, values, KEYS), icon: values[ICONS_BY_KIND[alert.kind]] as IconName, sound: values[ALERT_SOUND_KEYS[alert.kind]] };
}

export default function Alerts() {
  const values = usePlantage();
  const { current, leaving } = useAlerts(values.alertDuration);
  return (
    <div className={`pl-alerts`}>
      {current && <Card key={current.key} alert={current} leaving={leaving} seed={seedOf(String(current.key))} />}
    </div>
  );
}

function Card({ alert, leaving, seed }: { alert: Alert; leaving: boolean; seed: number }) {
  const values = usePlantage();
  const { tag, line, icon, sound } = describe(alert, values);
  const closing = values.soundLeave;
  useAlertSounds(values.alertSound ? () => playChime(sound) : null, values.alertSound ? () => playLeave(closing) : null, leaving);
  const said = values.alertQuote ? alertQuote(alert) : null;
  const quote = said ? fillTemplate(values.quoteFormat, { text: said }) : "";
  const [start] = useState(() => performance.now());
  const leavingAt = useRef<number | null>(null);
  useEffect(() => { if (leaving) leavingAt.current = performance.now(); }, [leaving]);
  const box = useRef<HTMLDivElement>(null);
  useTimeline(timeline => {
    timeline.from(".pl-medal", { scale: 0, duration: 0.55, ease: "back.out(2.2)" }, ENTER.medal);
    timeline.fromTo(".pl-alert-card", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(-40px -80px -80px -20px)", duration: 0.6, ease: "power3.out" }, ENTER.card);
    timeline.from(SplitText.create(".pl-alert-name", { type: "chars" }).chars, { y: RISE.name, scale: 0.4, opacity: 0, duration: 0.5, ease: "back.out(3)", stagger: 0.05 }, ENTER.name);
    timeline.from(".pl-alert-line", { opacity: 0, y: RISE.text, duration: 0.4 }, ENTER.line);
    timeline.from(".pl-quote", { opacity: 0, y: RISE.text, duration: 0.4 }, ENTER.quote);
  }, [], box);
  const layout = alertLayout({ medal: MEDAL.size, ring: MEDAL.ring, overlap: MEDAL.overlap, gap: values.alertGap });
  const style = { "--medal": `${MEDAL.size}px`, "--card-left": `${layout.cardLeft}px`, "--text-pad": `${layout.textPadding}px` } as CSSProperties;
  return (
    <div ref={box} className={`pl-alert${leaving ? " leaving" : ""}`} style={style}>
      <Medallion ring={values.alertStyle} icon={values.alertMangoOn ? null : icon} />
      <div className="pl-frost pl-alert-card">
        <span className="pl-st-pill"><i />{tag}</span>
        <b className="pl-alert-name">{alert.user}</b>
        <span className="pl-alert-line">{line}</span>
        {quote && <i className="pl-quote">{quote}</i>}
      </div>
      {values.alertTimer && <Branch lifeMs={values.alertDuration} />}
      <div className="pl-alert-burst-box" style={{ "--burst-x": `${BURST_CANVAS.x}px`, "--burst-y": `${BURST_CANVAS.y}px` } as CSSProperties}>
        <AlertBurst values={values} start={start} leavingAt={leavingAt} seed={seed} />
      </div>
    </div>
  );
}
