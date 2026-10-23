// Alerts of the KOTH theme: a dog tag on its chain with a radio set (3D, PLAN-KOTH.md package 4), a radio message card
// with callsign or a mission file; per alert kind header, line, symbol and sound; plus radio static when it appears and
// the remaining time as a bar.
// Texts, quote rule and sounds come from the alerts context of the core (src/core/alerts), here keys, symbols and the
// military look. Parameters: ?sound=0, ?volume=0.5
import { useCallback, useEffect, useMemo, useState } from "react";
import { ALERT_SOUND_KEYS, alertQuote, alertTextKeys, describeAlert } from "../../../core/alerts/alerts.ts";
import { useAlertSounds } from "../../../core/alerts/useAlertSounds.ts";
import { useAlerts } from "../../../core/hooks/useAlerts.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import Stage3D from "../../../core/three/Stage3D.tsx";
import { fillTemplate } from "../../../core/template.ts";
import type { Alert, AlertKind } from "../../../core/types.ts";
import type { KothClock } from "../build.ts";
import { ALERT_TOP, alertLayout, alertSteps, dogtagLines, swingAt } from "../dogtag.ts";
import { ICONS, type IconName } from "../hill.ts";
import RadioSet from "../radio/RadioSet.tsx";
import type { KothValues } from "../settings.ts";
import ShapeIcon from "../ShapeIcon.tsx";
import { playChime, playLeave } from "../tones.ts";
import DogTag from "../three/DogTag.tsx";
import SmokePuff from "../three/SmokePuff.tsx";
import { useClockValue, useRunClock } from "../useClock.ts";
import { kothNames, useKoth } from "../useKoth.ts";

type Key = keyof KothValues;
const KEYS = alertTextKeys("Tag");
// KOTH-specific: symbol on the card per alert kind
const ICONS_BY_KIND = {
  follow: "followIcon", sub: "subIcon", resub: "resubIcon", gift: "giftIcon", raid: "raidIcon", cheer: "cheerIcon", redeem: "redeemIcon", hype: "hypeIcon",
} as const satisfies Record<AlertKind, Key>;

function describe(alert: Alert, values: KothValues) {
  return { ...describeAlert(alert, values, KEYS), icon: values[ICONS_BY_KIND[alert.kind]] as IconName, sound: values[ALERT_SOUND_KEYS[alert.kind]] };
}

export default function Alerts() {
  const values = useKoth();
  const { current, leaving } = useAlerts(values.alertDuration);
  if (values.alertStyle === "marke") return <div className="kh-dogtag-alerts">{current && <DogtagAlert key={current.key} alert={current} leaving={leaving} />}</div>;
  return (
    <div className={`kh-alerts`}>
      {current && <Card key={current.key} alert={current} leaving={leaving} />}
    </div>
  );
}

// fixed: the radio set and its texts follow the alert clock 30 times a second
const FRAMES = 30;
// fixed: seconds in ms
const MS = 1000;
// fixed: far plane of the stage, the orthographic camera stands 1000 px in front
const FAR = 4000;
// fixed: seed offset, so the smoke of an alert differs from other bursts
const SMOKE_SEED = 11;

// Dog tag with radio (PLAN-KOTH.md package 4): one clock per alert drives the 3D tag, the smoke and the radio; ?t= stops it
function DogtagAlert({ alert, leaving }: { alert: Alert; leaving: boolean }) {
  const values = useKoth();
  const stage = useStage();
  const [clock] = useState<KothClock>(() => ({ time: 0 }));
  useRunClock(clock);
  const time = useClockValue(clock, now => Math.round(now * FRAMES) / FRAMES);
  const [leftAt, setLeftAt] = useState<number | null>(null);
  useEffect(() => { if (leaving) setLeftAt(at => at ?? clock.time); }, [leaving, clock]);
  const { tag, line, sound } = describe(alert, values);
  const closing = values.soundLeave;
  useAlertSounds(values.alertSound ? () => playChime(sound) : null, values.alertSound ? () => playLeave(closing) : null, leaving);
  const steps = useMemo(() => alertSteps(values.alertOpenMs, values.alertStaticMs), [values.alertOpenMs, values.alertStaticMs]);
  const layout = alertLayout("center", ALERT_TOP, values.alertWidth, values.alertScale);
  const stamped = useMemo(
    () => dogtagLines(values.dogtagLines, { ...kothNames(values), user: alert.user, amount: alert.amount === undefined ? "" : String(alert.amount) }),
    [values, alert],
  );
  const pose = useCallback((now: number) => swingAt(now, steps, values.dogtagSwing, leftAt === null ? null : now - leftAt, values.alertCloseMs), [steps, values.dogtagSwing, leftAt, values.alertCloseMs]);
  const said = values.alertQuote ? alertQuote(alert) : null;
  const text = said ? `${line}  //  ${fillTemplate(values.quoteFormat, { text: said })}` : line;
  const timer = values.alertTimer ? { start: steps.line.start, duration: Math.max(steps.line.duration, values.alertDuration / MS - steps.line.start), stagger: 0 } : null;
  return (
    <>
      {values.dogtagOn && (
        <Stage3D background={null} level={values.quality} fov={0} far={FAR} orthographic className="kh-dogtag-stage">
          <DogTag clock={clock} pose={pose} at={layout.tag} scale={values.alertScale} lines={stamped} metal={values.dogtagMetal} />
          {values.alertSmokeOn && <SmokePuff clock={clock} start={steps.radio.start} at={layout.tag} scale={values.alertScale} seed={alert.user.length + SMOKE_SEED} colors={[values.smokeColor, values.sandDark]} />}
        </Stage3D>
      )}
      <div className="kh-dogtag-radio stage-box" ref={stage}>
        <RadioSet
          time={time} steps={steps} leftFor={leftAt === null ? null : time - leftAt} closeMs={values.alertCloseMs} timer={timer}
          channel={values.radioChannel} tag={`${fillTemplate(values.alertCallsign, kothNames(values))}  //  ${tag}`} name={alert.user} line={text} at={layout.radio} width={values.alertWidth} scale={values.alertScale}
        />
      </div>
    </>
  );
}

function Card({ alert, leaving }: { alert: Alert; leaving: boolean }) {
  const values = useKoth();
  const { tag, line, icon, sound } = describe(alert, values);
  const closing = values.soundLeave;
  useAlertSounds(values.alertSound ? () => playChime(sound) : null, values.alertSound ? () => playLeave(closing) : null, leaving);
  const said = values.alertQuote ? alertQuote(alert) : null;
  const quote = said ? fillTemplate(values.quoteFormat, { text: said }) : "";
  return (
    <div className={`kh-alert kh-alert-${values.alertStyle} in-${values.alertIn} out-${values.alertOut}${leaving ? " leaving" : ""}${values.alertStatic ? " static" : ""}`}>
      <div className="kh-alert-body">
        <span className="kh-callsign">{fillTemplate(values.alertCallsign, kothNames(values))}</span>
        <div className="kh-alert-icon"><ShapeIcon shape={ICONS[icon]} /></div>
        <div className="kh-alert-text">
          <span className="kh-tag">{tag}</span>
          <b className="kh-alert-line">{line}</b>
          {quote && <i className="kh-quote">{quote}</i>}
        </div>
      </div>
      {values.alertTimer && <div className="kh-timer" aria-hidden="true" />}
    </div>
  );
}
