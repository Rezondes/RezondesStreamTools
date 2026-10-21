// Alerts of the Dachdecker theme (DESIGN-DACHDECKER.md "Alerts"), transparent: the dimension line with its text draws
// itself from the middle outwards, the blueprint sign opens from the middle, head line and name decode, the line and the
// quote appear, the remaining time as a dimension chain that pulls back; leaving runs the other way. Built-in hammer
// knocks unless own files are chosen. Texts, quote rule and sounds come from the alerts context of the core.
// Parameters: ?sound=0, ?volume=0.5
import { useState } from "react";
import { ALERT_SOUND_KEYS, alertQuote } from "../../../core/alerts/alerts.ts";
import { useAlertSounds } from "../../../core/alerts/useAlertSounds.ts";
import { useAlerts } from "../../../core/hooks/useAlerts.ts";
import { useNow } from "../../../core/hooks/useNow.ts";
import { fillTemplate } from "../../../core/template.ts";
import type { Alert } from "../../../core/types.ts";
import { alertTexts } from "../alerts.ts";
import DimensionLine from "../plan/DimensionLine.tsx";
import PlanSign from "../plan/PlanSign.tsx";
import { SCRAMBLE_TICK_MS, scrambled } from "../plan/scramble.ts";
import { playKnock, playLeave } from "../tones.ts";
import { useDachdecker } from "../useDachdecker.ts";

export default function Alerts() {
  const values = useDachdecker();
  const { current, leaving } = useAlerts(values.alertDuration);
  return <div className="dd-alerts">{current && <Sign key={current.key} alert={current} leaving={leaving} />}</div>;
}

function Sign({ alert, leaving }: { alert: Alert; leaving: boolean }) {
  const values = useDachdecker();
  const { tag, line, dim } = alertTexts(alert, values);
  const sound = values[ALERT_SOUND_KEYS[alert.kind]];
  const closing = values.soundLeave;
  useAlertSounds(values.alertSound ? () => playKnock(sound) : null, values.alertSound ? () => playLeave(closing) : null, leaving);
  const [start] = useState(Date.now);
  const now = useNow(SCRAMBLE_TICK_MS);
  const share = values.scramble ? (now - start) / values.scrambleMs : 1;
  const tick = Math.floor((now - start) / SCRAMBLE_TICK_MS);
  const said = values.alertQuote ? alertQuote(alert) : null;
  const quote = said ? fillTemplate(values.quoteFormat, { text: said }) : "";
  return (
    <div className={`dd-alert${leaving ? " leaving" : ""}`}>
      {values.alertDim && <DimensionLine text={dim} />}
      <PlanSign corners={values.alertCorners} className="dd-alert-sign">
        <p className="dd-alert-tag">{scrambled(tag, share, tick)}</p>
        <b className="dd-alert-name">{scrambled(alert.user, share, tick)}</b>
        {line && <p className="dd-alert-line">{line}</p>}
        {quote && <i className="dd-quote">{quote}</i>}
        {values.alertTimer && <i className="dd-alert-timer" aria-hidden="true" />}
      </PlanSign>
    </div>
  );
}
