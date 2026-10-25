// Alerts of the Chaos theme (PLAN-CHAOS.md package 8, refs/alert.html): only the note in the middle. It slaps onto the
// wall (too big, then flat), spray mist bursts around it (pixi/SprayBurst.tsx), its rough marker edge draws itself, the
// tape sits, the kind chip pops, the name is sprayed on, line and quote follow, confetti of Rough scribbles is thrown out
// of it; the remaining time is a rough marker stroke that pulls back; it leaves with a glitch. Built-in zap sounds unless
// own files are chosen. Texts, quote rule and sounds come from the alerts context of the core (src/core/alerts).
// Parameters: ?sound=0, ?volume=0.5, ?t=<s> (still of the throw)
import { type CSSProperties, useMemo, useState } from "react";
import { ALERT_SOUND_KEYS, alertQuote, alertTextKeys, describeAlert } from "../../../core/alerts/alerts.ts";
import { useAlertSounds } from "../../../core/alerts/useAlertSounds.ts";
import { useAlerts } from "../../../core/hooks/useAlerts.ts";
import { roughPath } from "../../../core/rough/roughSvg.ts";
import { sceneFrame } from "../../../core/sceneArea.ts";
import { fillTemplate } from "../../../core/template.ts";
import type { Alert } from "../../../core/types.ts";
import { ALERT_TOP } from "../areas.ts";
import Confetti from "../Confetti.tsx";
import Note from "../Note.tsx";
import SprayBurst from "../pixi/SprayBurst.tsx";
import SprayTitle from "../SprayTitle.tsx";
import { playFade, playZap } from "../tones.ts";
import { useChaos } from "../useChaos.ts";

const KEYS = alertTextKeys("Tag");
type Queued = NonNullable<ReturnType<typeof useAlerts>["current"]>;
// fixed: the note is about this high (px), the confetti is thrown from its middle
const NOTE_HEIGHT = 300;
// fixed: the timer stroke as a rough line in a 720 x 30 frame
const TIMER = { width: 720, height: 30, line: 8, roughness: 1.6, seed: 9 };

export default function Alerts() {
  const values = useChaos();
  const { current, leaving } = useAlerts(values.alertDuration);
  if (!current) return <div className="ch-alerts" />;
  return (
    <div className={`ch-alerts${leaving ? " leaving" : ""}`}>
      <Thrown key={current.key} alert={current} leaving={leaving} />
    </div>
  );
}

// One alert: spray burst, the note and the confetti, all timed from the moment it came
function Thrown({ alert, leaving }: { alert: Queued; leaving: boolean }) {
  const values = useChaos();
  const [start] = useState(() => performance.now());
  const origin = useMemo(() => ({ x: sceneFrame().width * 0.5, y: ALERT_TOP + NOTE_HEIGHT * 0.5 }), []);
  const note = useMemo(() => ({ top: ALERT_TOP, width: values.alertWidth, height: NOTE_HEIGHT }), [values.alertWidth]);
  return (
    <>
      {values.alertSprayOn && <SprayBurst values={values} start={start} seed={alert.key} note={note} />}
      <Card alert={alert} leaving={leaving} />
      {values.confetti && <Confetti count={values.confettiCount} seed={alert.key} origin={origin} start={start} piece={{ size: values.confettiSize, line: values.confettiLine }} />}
    </>
  );
}

function Card({ alert, leaving }: { alert: Alert; leaving: boolean }) {
  const values = useChaos();
  const { tag, line } = describeAlert(alert, values, KEYS);
  const sound = values[ALERT_SOUND_KEYS[alert.kind]];
  const closing = values.soundLeave;
  useAlertSounds(values.alertSound ? () => playZap(sound) : null, values.alertSound ? () => playFade(closing) : null, leaving);
  const said = values.alertQuote ? alertQuote(alert) : null;
  const quote = said ? fillTemplate(values.quoteFormat, { text: said }) : "";
  const timer = useMemo(() => roughPath({ kind: "line", from: [0, TIMER.height * 0.5], to: [TIMER.width, TIMER.height * 0.4] }, { roughness: TIMER.roughness, bowing: 1, strokeWidth: TIMER.line, fill: "none" }, TIMER.seed), []);
  return (
    <Note tape className={`ch-alert${leaving ? " leaving" : ""}`} style={{ "--slap": values.alertSlapScale, "--name-chars": alert.user.length } as CSSProperties}>
      <span className="ch-chip">{tag}</span>
      <SprayTitle text={alert.user} seed={`alert-${alert.kind}`} className="ch-alert-name" />
      <b className="ch-alert-line">{line}</b>
      {quote && <i className="ch-quote">{quote}</i>}
      {values.alertTimer && (
        <svg className="ch-timer" viewBox={`0 0 ${TIMER.width} ${TIMER.height}`} aria-hidden="true">
          {timer.map(part => <path key={part.d} d={part.d} pathLength={1} />)}
        </svg>
      )}
    </Note>
  );
}
