// Alerts des Standard-Themes: eine abgerundete Karte mit Verlaufskante, Kopfzeile je Alert-Art, Zeile mit dem Namen,
// optional der Nachricht und einem Restzeit-Balken. Ton nur mit eigener Datei. Texte, Zitat-Regel und Töne kommen aus
// dem Alerts-Kontext des Kerns (src/core/alerts), hier nur die Schlüssel der Texte und das Aussehen.
import { alertQuote, describeAlert, type AlertTextKeys } from "../../../core/alerts/alerts.ts";
import { useAlertSounds } from "../../../core/alerts/useAlertSounds.ts";
import type { Alert } from "../../../core/types.ts";
import { useAlerts } from "../../../core/hooks/useAlerts.ts";
import { playSound } from "../../../core/sound.ts";
import { useStandard } from "../useStandard.ts";

const KEYS: AlertTextKeys = {
  tag: { follow: "followLabel", sub: "subLabel", resub: "resubLabel", gift: "giftLabel", raid: "raidLabel", cheer: "cheerLabel", redeem: "redeemLabel", hype: "hypeLabel" },
  line: { follow: "followLine", sub: "subLine", resub: "resubLine", gift: "giftLine", raid: "raidLine", cheer: "cheerLine", redeem: "redeemLine", hype: "hypeBeginLine" },
  hypeEndLine: "hypeEndLine",
};

export default function Alerts() {
  const values = useStandard();
  const { current, leaving } = useAlerts(values.alertDuration);
  return <div className="standard-alerts">{current && <Card key={current.key} alert={current} leaving={leaving} />}</div>;
}

function Card({ alert, leaving }: { alert: Alert; leaving: boolean }) {
  const values = useStandard();
  const sound = values.alertSound;
  useAlertSounds(() => playSound(sound, () => {}), null, leaving);
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
