// Alerts of the Kebab theme (DESIGN-KEBAB.md "Alerts", prototype refs/alert.html), transparent on the stage: as a bon
// out of the printer with a stamp (default) or as a paper bag that drops in. The cash register rings when an alert
// appears, the paper tears when it leaves (built-in sounds unless own files are chosen). Texts, quote rule and sounds
// come from the alerts context of the core. Parameters: ?sound=0, ?volume=0.5
import type { CSSProperties } from "react";
import { ALERT_SOUND_KEYS } from "../../../core/alerts/alerts.ts";
import { useAlertSounds } from "../../../core/alerts/useAlertSounds.ts";
import { useAlerts } from "../../../core/hooks/useAlerts.ts";
import type { Alert } from "../../../core/types.ts";
import { alertTexts } from "../alerts.ts";
import { ALERT_SIZES } from "../areas.ts";
import AlertBag from "../screen/AlertBag.tsx";
import AlertBon from "../screen/AlertBon.tsx";
import { playRegister, playTear } from "../tones.ts";
import { kebabNames, useKebab } from "../useKebab.ts";

export default function Alerts() {
  const values = useKebab();
  const { current, leaving } = useAlerts(values.alertDuration);
  return <div className="kb-alerts">{current && <Order key={current.key} alert={current} leaving={leaving} />}</div>;
}

function Order({ alert, leaving }: { alert: Alert; leaving: boolean }) {
  const values = useKebab();
  const sound = values[ALERT_SOUND_KEYS[alert.kind]];
  const closing = values.soundLeave;
  useAlertSounds(values.alertSound ? () => playRegister(sound) : null, values.alertSound ? () => playTear(closing) : null, leaving);
  const texts = alertTexts(alert, values);
  const shop = kebabNames(values).shop;
  // The bon is as wide as the setting, the bag with its steam grows with it from its own width at the default
  const width = { "--kb-alert-printer": `${values.alertWidth}px`, "--kb-bag-scale": values.alertWidth / ALERT_SIZES.bon.width } as CSSProperties;
  return (
    <div className={`kb-alert${leaving ? " leaving" : ""}`} style={width}>
      {values.alertStyle === "tuete"
        ? <AlertBag texts={texts} user={alert.user} values={values} sound={values.alertSound ? sound : null} />
        : <AlertBon texts={texts} user={alert.user} shop={shop} values={values} sound={values.alertSound ? sound : null} />}
    </div>
  );
}
