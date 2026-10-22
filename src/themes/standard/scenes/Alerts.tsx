// Alerts of the standard theme: a rounded card with a gradient edge, header per alert kind, line with the name,
// optionally the message and a remaining-time bar. Built-in chime and fade-out tone (tones.ts), an own file per alert
// kind replaces them, "Töne" switches them off. Texts, quote rule and sounds come from
// the alerts context of the core (src/core/alerts), here only the keys of the texts and the look.
import { ALERT_SOUND_KEYS, alertQuote, alertTextKeys, describeAlert } from "../../../core/alerts/alerts.ts";
import { useAlertSounds } from "../../../core/alerts/useAlertSounds.ts";
import type { Alert } from "../../../core/types.ts";
import { useAlerts } from "../../../core/hooks/useAlerts.ts";
import { playChime, playLeave } from "../tones.ts";
import { useStandard } from "../useStandard.ts";

// Headers are called <kind>Label here
const KEYS = alertTextKeys("Label");

export default function Alerts() {
  const values = useStandard();
  const { current, leaving } = useAlerts(values.alertDuration);
  return <div className="standard-alerts">{current && <Card key={current.key} alert={current} leaving={leaving} />}</div>;
}

function Card({ alert, leaving }: { alert: Alert; leaving: boolean }) {
  const values = useStandard();
  const sound = values[ALERT_SOUND_KEYS[alert.kind]];
  const closing = values.soundLeave;
  useAlertSounds(values.alertSound ? () => playChime(sound) : null, values.alertSound ? () => playLeave(closing) : null, leaving);
  const { tag, line } = describeAlert(alert, values, KEYS);
  const quote = values.alertMessage ? alertQuote(alert) : null;
  return (
    <div className={`standard-card standard-alert${leaving ? " leaving" : ""}`}>
      <span className="standard-chip">{tag}</span>
      <div className="standard-line">{line}</div>
      {quote && <div className="standard-muted">{quote}</div>}
      {values.alertProgress && <div className="standard-timer" aria-hidden="true" />}
    </div>
  );
}
