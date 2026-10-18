// Alerts of the KOTH theme: radio message card with callsign, a mission file or a stencilled sign, per alert kind header,
// line, symbol and sound; plus radio static when it appears and the remaining time as a bar.
// Texts, quote rule and sounds come from the alerts context of the core (src/core/alerts), here keys, symbols and the
// military look. Parameters: ?sound=0, ?volume=0.5
import { ALERT_SOUND_KEYS, alertQuote, alertTextKeys, describeAlert } from "../../../core/alerts/alerts.ts";
import { useAlertSounds } from "../../../core/alerts/useAlertSounds.ts";
import { useAlerts } from "../../../core/hooks/useAlerts.ts";
import { fillTemplate } from "../../../core/template.ts";
import type { Alert, AlertKind } from "../../../core/types.ts";
import { ICONS, type IconName } from "../hill.ts";
import type { KothValues } from "../settings.ts";
import ShapeIcon from "../ShapeIcon.tsx";
import { playChime, playLeave } from "../tones.ts";
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
  return (
    <div className={`kh-alerts align-${values.alertAlign}`}>
      {current && <Card key={current.key} alert={current} leaving={leaving} />}
    </div>
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
