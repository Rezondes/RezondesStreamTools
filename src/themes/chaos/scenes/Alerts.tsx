// Alerts of the Chaos theme: energy swathes strike in from one side (left, right or alternating), on them a note with a
// rough marker edge: header on tape, the name as sprayed graffiti, the line and the quote, the remaining time as a
// marker line that pulls back; confetti of small scribbles tumbles down. Built-in zap sounds unless own files are chosen.
// Texts, quote rule and sounds come from the alerts context of the core (src/core/alerts), here the keys and the look.
// Parameters: ?sound=0, ?volume=0.5
import { ALERT_SOUND_KEYS, alertQuote, alertTextKeys, describeAlert } from "../../../core/alerts/alerts.ts";
import { useAlertSounds } from "../../../core/alerts/useAlertSounds.ts";
import { useAlerts } from "../../../core/hooks/useAlerts.ts";
import { fillTemplate } from "../../../core/template.ts";
import type { Alert } from "../../../core/types.ts";
import Confetti from "../Confetti.tsx";
import EnergySwathes from "../EnergySwathes.tsx";
import Note from "../Note.tsx";
import SprayTitle from "../SprayTitle.tsx";
import { swathSide } from "../swathes.ts";
import { playFade, playZap } from "../tones.ts";
import { useChaos } from "../useChaos.ts";

const KEYS = alertTextKeys("Tag");

export default function Alerts() {
  const values = useChaos();
  const { current, leaving } = useAlerts(values.alertDuration);
  if (!current) return <div className="ch-alerts" />;
  const side = swathSide(values.alertSide, current.key);
  return (
    <div className={`ch-alerts ch-from-${side}${leaving ? " leaving" : ""}`}>
      <EnergySwathes key={`swath-${current.key}`} side={side} seed={current.key} />
      <Card key={current.key} alert={current} leaving={leaving} />
      {values.confetti && <Confetti key={`confetti-${current.key}`} count={values.confettiCount} seed={current.key} />}
    </div>
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
  return (
    <Note tape className={`ch-alert${leaving ? " leaving" : ""}`}>
      <span className="ch-chip">{tag}</span>
      <SprayTitle text={alert.user} seed={`alert-${alert.kind}`} className="ch-alert-name" />
      <b className="ch-alert-line">{line}</b>
      {quote && <i className="ch-quote">{quote}</i>}
      {values.alertTimer && <div className="ch-timer" aria-hidden="true"><span /></div>}
    </Note>
  );
}
