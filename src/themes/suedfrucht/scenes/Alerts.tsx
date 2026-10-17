// Alerts of the Südfrucht theme: postcard with stamp and postmark, surfboard on a wave or message in a bottle,
// per alert kind header, line, symbol and sound; plus hibiscus confetti, water splashes and the remaining time as a rope.
// Texts, quote rule and sounds come from the alerts context of the core (src/core/alerts), here keys, symbols and
// the beach look. Parameters: ?sound=0, ?volume=0.5
import type { CSSProperties } from "react";
import { ALERT_SOUND_KEYS, alertQuote, alertTextKeys, describeAlert } from "../../../core/alerts/alerts.ts";
import { useAlertSounds } from "../../../core/alerts/useAlertSounds.ts";
import { hash } from "../../../core/hash.ts";
import { useAlerts } from "../../../core/hooks/useAlerts.ts";
import { fillTemplate } from "../../../core/template.ts";
import type { Alert, AlertKind } from "../../../core/types.ts";
import { ICONS, type IconName } from "../beach.ts";
import type { SuedfruchtValues } from "../settings.ts";
import ShapeIcon from "../ShapeIcon.tsx";
import { playChime, playLeave } from "../tones.ts";
import { useSuedfrucht } from "../useSuedfrucht.ts";

type Key = keyof SuedfruchtValues;
const KEYS = alertTextKeys("Tag");
// Südfrucht-specific: symbol on the stamp per alert kind
const ICONS_BY_KIND = {
  follow: "followIcon", sub: "subIcon", resub: "resubIcon", gift: "giftIcon", raid: "raidIcon", cheer: "cheerIcon", redeem: "redeemIcon", hype: "hypeIcon",
} as const satisfies Record<AlertKind, Key>;

// fixed: number of water drops in the splash
const DROPS = 9;

function describe(alert: Alert, values: SuedfruchtValues) {
  return { ...describeAlert(alert, values, KEYS), icon: values[ICONS_BY_KIND[alert.kind]] as IconName, sound: values[ALERT_SOUND_KEYS[alert.kind]] };
}

export default function Alerts() {
  const values = useSuedfrucht();
  const { current, leaving } = useAlerts(values.alertDuration);
  return (
    <div className={`sf-alerts align-${values.alertAlign}`}>
      {current && <Card key={current.key} alert={current} leaving={leaving} />}
      {current && values.petals && <Petals key={`petals-${current.key}`} count={values.petalCount} />}
    </div>
  );
}

function Card({ alert, leaving }: { alert: Alert; leaving: boolean }) {
  const values = useSuedfrucht();
  const { tag, line, icon, sound } = describe(alert, values);
  const closing = values.soundLeave;
  useAlertSounds(values.alertSound ? () => playChime(sound) : null, values.alertSound ? () => playLeave(closing) : null, leaving);
  const said = values.alertQuote ? alertQuote(alert) : null;
  const quote = said ? fillTemplate(values.quoteFormat, { text: said }) : "";
  return (
    <div className={`sf-alert sf-alert-${values.alertStyle} in-${values.alertIn} out-${values.alertOut}${leaving ? " leaving" : ""}`}>
      {values.alertStyle === "flaschenpost" && <div className="sf-bottle" aria-hidden="true" />}
      <div className="sf-alert-body">
        <div className="sf-stamp"><ShapeIcon shape={ICONS[icon]} /></div>
        <div className="sf-alert-text">
          <span className="sf-tag">{tag}</span>
          <b className="sf-alert-line">{line}</b>
          {quote && <i className="sf-quote">{quote}</i>}
        </div>
        {values.alertStyle === "postkarte" && <span className="sf-postmark">{values.channelName}</span>}
        {values.splash && <Splash />}
      </div>
      {values.alertTimer && <div className="sf-rope" aria-hidden="true" />}
    </div>
  );
}

function Splash() {
  return (
    <div className="sf-splash" aria-hidden="true">
      {Array.from({ length: DROPS }, (_, index) => <i key={index} style={{ "--i": index, "--n": DROPS } as CSSProperties} />)}
    </div>
  );
}

// Position, rotation and start of a blossom, three own values per blossom from hash
// fixed: three start values per blossom (position, rotation, delay)
const petalStyle = (index: number) => ({ "--x": hash(index * 3 + 1), "--spin": hash(index * 3 + 2), "--delay": hash(index * 3 + 3) }) as CSSProperties;

// Hibiscus blossoms fall over the whole picture; position, rotation and start from hash, so every blossom falls differently
function Petals({ count }: { count: number }) {
  return (
    <div className="sf-petals" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="sf-petal" style={petalStyle(index)}>
          <ShapeIcon shape={ICONS.hibiskus} />
        </div>
      ))}
    </div>
  );
}
