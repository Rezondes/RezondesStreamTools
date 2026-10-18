// Alerts of the Plantage theme: crate label, harvest slip or a basket, per alert kind header, line, symbol and sound;
// plus falling mango leaves, a juice splash and the remaining time as a shrinking branch.
// Texts, quote rule and sounds come from the alerts context of the core (src/core/alerts), here keys, symbols and
// the plantation look. Parameters: ?sound=0, ?volume=0.5
import type { CSSProperties } from "react";
import { ALERT_SOUND_KEYS, alertQuote, alertTextKeys, describeAlert } from "../../../core/alerts/alerts.ts";
import { useAlertSounds } from "../../../core/alerts/useAlertSounds.ts";
import { hash } from "../../../core/hash.ts";
import { useAlerts } from "../../../core/hooks/useAlerts.ts";
import { fillTemplate } from "../../../core/template.ts";
import type { Alert, AlertKind } from "../../../core/types.ts";
import { ICONS, LEAF, type IconName } from "../field.ts";
import type { PlantageValues } from "../settings.ts";
import ShapeIcon from "../ShapeIcon.tsx";
import { playChime, playLeave } from "../tones.ts";
import { usePlantage } from "../usePlantage.ts";

type Key = keyof PlantageValues;
const KEYS = alertTextKeys("Tag");
// Plantage-specific: symbol on the label per alert kind
const ICONS_BY_KIND = {
  follow: "followIcon", sub: "subIcon", resub: "resubIcon", gift: "giftIcon", raid: "raidIcon", cheer: "cheerIcon", redeem: "redeemIcon", hype: "hypeIcon",
} as const satisfies Record<AlertKind, Key>;

// fixed: number of juice drops in the splash
const DROPS = 9;

function describe(alert: Alert, values: PlantageValues) {
  return { ...describeAlert(alert, values, KEYS), icon: values[ICONS_BY_KIND[alert.kind]] as IconName, sound: values[ALERT_SOUND_KEYS[alert.kind]] };
}

export default function Alerts() {
  const values = usePlantage();
  const { current, leaving } = useAlerts(values.alertDuration);
  return (
    <div className={`pl-alerts align-${values.alertAlign}`}>
      {current && <Card key={current.key} alert={current} leaving={leaving} />}
      {current && values.leafConfetti && <Leaves key={`leaves-${current.key}`} count={values.leafCount} />}
    </div>
  );
}

function Card({ alert, leaving }: { alert: Alert; leaving: boolean }) {
  const values = usePlantage();
  const { tag, line, icon, sound } = describe(alert, values);
  const closing = values.soundLeave;
  useAlertSounds(values.alertSound ? () => playChime(sound) : null, values.alertSound ? () => playLeave(closing) : null, leaving);
  const said = values.alertQuote ? alertQuote(alert) : null;
  const quote = said ? fillTemplate(values.quoteFormat, { text: said }) : "";
  return (
    <div className={`pl-alert pl-alert-${values.alertStyle} in-${values.alertIn} out-${values.alertOut}${leaving ? " leaving" : ""}`}>
      <div className="pl-alert-body">
        <div className="pl-label"><ShapeIcon shape={ICONS[icon]} /></div>
        <div className="pl-alert-text">
          <span className="pl-tag">{tag}</span>
          <b className="pl-alert-line">{line}</b>
          {quote && <i className="pl-quote">{quote}</i>}
        </div>
        {values.alertStyle === "kiste" && <span className="pl-stamp">{values.channelName}</span>}
        {values.juice && <Juice />}
      </div>
      {values.alertTimer && <div className="pl-branch" aria-hidden="true" />}
    </div>
  );
}

function Juice() {
  return (
    <div className="pl-splash" aria-hidden="true">
      {Array.from({ length: DROPS }, (_, index) => <i key={index} style={{ "--i": index, "--n": DROPS } as CSSProperties} />)}
    </div>
  );
}

// fixed: three start values per leaf (position, rotation, delay)
const leafStyle = (index: number) => ({ "--x": hash(index * 3 + 1), "--spin": hash(index * 3 + 2), "--delay": hash(index * 3 + 3) }) as CSSProperties;

// Mango leaves fall over the whole picture; position, rotation and start from hash, so every leaf falls differently
function Leaves({ count }: { count: number }) {
  return (
    <div className="pl-leaves" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="pl-leaf" style={leafStyle(index)}>
          <ShapeIcon shape={LEAF} />
        </div>
      ))}
    </div>
  );
}
