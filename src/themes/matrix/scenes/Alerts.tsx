// Alert overlay, transparent. Recommended as browser source 1920x1080. Texts per alert kind, position, size, duration,
// animations and sounds come from the settings. Texts, quote rule and sounds come from the alerts context of the core
// (src/core/alerts), here only the keys of the texts and the matrix look. Parameters: ?sound=0, ?volume=0.5, ?demo
import MatrixRain from "../MatrixRain.tsx";
import { ALERT_SOUND_KEYS, alertQuote, alertTextKeys, describeAlert } from "../../../core/alerts/alerts.ts";
import { useAlertSounds } from "../../../core/alerts/useAlertSounds.ts";
import type { Alert } from "../../../core/types.ts";
import { fillTemplate } from "../../../core/template.ts";
import { useAlerts } from "../../../core/hooks/useAlerts.ts";
import { useMatrixDecode } from "../useMatrixDecode.ts";
import { playLeave, playOpen } from "../tones.ts";
import { useMatrix } from "../useMatrix.ts";

// Texts following the usual pattern, plus matrix-specific: single gift sub and sub tier in upper case
const KEYS = alertTextKeys("Tag", { giftOneLine: "giftOneLine", giftToLine: "giftToLine", tierSuffix: "tierSuffix", tierUpper: true });

export default function Alerts() {
  const values = useMatrix();
  const { current, leaving } = useAlerts(values.alertDuration);
  return <div className={`alerts align-${values.alertAlign}`}>{current && <AlertBox key={current.key} alert={current} leaving={leaving} />}</div>;
}

function AlertBox({ alert, leaving }: { alert: Alert; leaving: boolean }) {
  const values = useMatrix();
  const { tag, line } = describeAlert(alert, values, KEYS);
  // Matrix-specific: the hype train has its own title instead of a name
  const title = alert.kind === "hype" ? values.hypeTitle : alert.user;
  const header = useMatrixDecode(fillTemplate(values.alertHeader, { tag }), "alertHeader");
  const name = useMatrixDecode(title.toUpperCase(), "alertName");
  const sub = useMatrixDecode(line, "alertLine");
  const said = values.alertQuote ? alertQuote(alert) : null;
  const quote = useMatrixDecode(said ? fillTemplate(values.quoteFormat, { text: said }) : "", "alertQuote");
  const opening = values[ALERT_SOUND_KEYS[alert.kind]];
  const closing = values.soundLeave;
  useAlertSounds(values.alertSound ? () => playOpen(opening) : null, values.alertSound ? () => playLeave(closing) : null, leaving);

  return (
    <div className={`alert in-${values.alertIn} out-${values.alertOut}${leaving ? " leaving" : ""}`}>
      <div className="alert-body">
        {values.rainAlerts && <MatrixRain size={values.rainSizeAlerts} opacity={values.rainOpacityAlerts} />}
        <div className="alert-head">{header}</div>
        <div className="alert-name glow glitch" data-text={name}>{name}</div>
        <div className="alert-line">{sub}</div>
        {quote && <div className="alert-quote muted">{quote}</div>}
        {values.alertTimer && <div className="alert-timer" />}
      </div>
    </div>
  );
}
