// Alert-Overlay, transparent. Empfohlen als Browserquelle 1920x1080. Texte je Alert-Art, Position, Grösse, Dauer,
// Animationen und Töne kommen aus den Einstellungen. Texte, Zitat-Regel und Töne kommen aus dem Alerts-Kontext des Kerns
// (src/core/alerts), hier nur die Schlüssel der Texte und das Matrix-Aussehen. Parameter: ?sound=0, ?volume=0.5, ?demo
import MatrixRain from "../MatrixRain.tsx";
import { alertQuote, describeAlert, type AlertTextKeys } from "../../../core/alerts/alerts.ts";
import { useAlertSounds } from "../../../core/alerts/useAlertSounds.ts";
import type { Alert, AlertKind } from "../../../core/types.ts";
import { fillTemplate } from "../../../core/template.ts";
import { useAlerts } from "../../../core/hooks/useAlerts.ts";
import { useMatrixDecode } from "../useMatrixDecode.ts";
import { playLeave, playOpen } from "../tones.ts";
import { useMatrix } from "../useMatrix.ts";
import type { MatrixValues } from "../settings.ts";

const SOUND = {
  follow: "soundFollow",
  sub: "soundSub",
  resub: "soundResub",
  gift: "soundGift",
  raid: "soundRaid",
  cheer: "soundCheer",
  redeem: "soundRedeem",
  hype: "soundHype",
} as const satisfies Record<AlertKind, keyof MatrixValues>;

const KEYS: AlertTextKeys = {
  tag: { follow: "followTag", sub: "subTag", resub: "resubTag", gift: "giftTag", raid: "raidTag", cheer: "cheerTag", redeem: "redeemTag", hype: "hypeTag" },
  line: { follow: "followLine", sub: "subLine", resub: "resubLine", gift: "giftLine", raid: "raidLine", cheer: "cheerLine", redeem: "redeemLine", hype: "hypeBeginLine" },
  hypeEndLine: "hypeEndLine",
  giftOneLine: "giftOneLine",
  giftToLine: "giftToLine",
  tierSuffix: "tierSuffix",
  tierUpper: true,
};

export default function Alerts() {
  const values = useMatrix();
  const { current, leaving } = useAlerts(values.alertDuration);
  return <div className={`alerts align-${values.alertAlign}`}>{current && <AlertBox key={current.key} alert={current} leaving={leaving} />}</div>;
}

function AlertBox({ alert, leaving }: { alert: Alert; leaving: boolean }) {
  const values = useMatrix();
  const { tag, line } = describeAlert(alert, values, KEYS);
  // Matrix-eigen: der Hype Train hat statt eines Namens einen eigenen Titel
  const title = alert.kind === "hype" ? values.hypeTitle : alert.user;
  const header = useMatrixDecode(fillTemplate(values.alertHeader, { tag }), "alertHeader");
  const name = useMatrixDecode(title.toUpperCase(), "alertName");
  const sub = useMatrixDecode(line, "alertLine");
  const said = values.alertQuote ? alertQuote(alert) : null;
  const quote = useMatrixDecode(said ? fillTemplate(values.quoteFormat, { text: said }) : "", "alertQuote");
  const opening = values[SOUND[alert.kind]];
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
