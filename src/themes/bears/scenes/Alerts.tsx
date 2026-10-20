// Alerts of the Bärenbande theme: a paper card with the outline and the symbol of the alert kind, the chosen bear (or the
// tower) peeks out beside it and reacts (Grizzly and Panda cheer, Eisbär gives a thumbs up); confetti of paw prints and
// leaves, the remaining time as a shrinking outlined bar. Texts, quote rule and sounds come from the alerts context of
// the core (src/core/alerts), here keys, symbols and the look. Parameters: ?sound=0, ?volume=0.5
import type { CSSProperties } from "react";
import { ALERT_SOUND_KEYS, alertQuote, alertTextKeys, describeAlert } from "../../../core/alerts/alerts.ts";
import { useAlertSounds } from "../../../core/alerts/useAlertSounds.ts";
import { hash } from "../../../core/hash.ts";
import { useAlerts } from "../../../core/hooks/useAlerts.ts";
import { fillTemplate } from "../../../core/template.ts";
import type { Alert, AlertKind } from "../../../core/types.ts";
import type { BearId } from "../bears.ts";
import type { PoseName } from "../rig.ts";
import Hero from "../Hero.tsx";
import type { IconName } from "../icons.ts";
import IconShape from "../IconShape.tsx";
import type { BearsValues } from "../settings.ts";
import { playChime, playLeave } from "../tones.ts";
import { useBears } from "../useBears.ts";

type Key = keyof BearsValues;
const KEYS = alertTextKeys("Tag");
// Symbol on the card per alert kind
const ICONS_BY_KIND = {
  follow: "followIcon", sub: "subIcon", resub: "resubIcon", gift: "giftIcon", raid: "raidIcon", cheer: "cheerIcon", redeem: "redeemIcon", hype: "hypeIcon",
} as const satisfies Record<AlertKind, Key>;
// How every bear reacts to an alert
const POSES: Record<BearId, PoseName> = { eisbaer: "thumbs", grizzly: "cheer", panda: "cheer" };
// Confetti alternates between paw prints and leaves
const CONFETTI: readonly IconName[] = ["pfote", "blatt"];

function describe(alert: Alert, values: BearsValues) {
  return { ...describeAlert(alert, values, KEYS), icon: values[ICONS_BY_KIND[alert.kind]] as IconName, sound: values[ALERT_SOUND_KEYS[alert.kind]] };
}

export default function Alerts() {
  const values = useBears();
  const { current, leaving } = useAlerts(values.alertDuration);
  return (
    <div className={`bb-alerts align-${values.alertAlign} bb-facing-${values.facing} ${values.blinkEvery > 0 ? "bb-blinking" : ""}`}>
      {current && <Card key={current.key} alert={current} leaving={leaving} />}
      {current && values.confetti && <Confetti key={`confetti-${current.key}`} count={values.confettiCount} />}
    </div>
  );
}

function Card({ alert, leaving }: { alert: Alert; leaving: boolean }) {
  const values = useBears();
  const { tag, line, icon, sound } = describe(alert, values);
  const closing = values.soundLeave;
  useAlertSounds(values.alertSound ? () => playChime(sound) : null, values.alertSound ? () => playLeave(closing) : null, leaving);
  const said = values.alertQuote ? alertQuote(alert) : null;
  const quote = said ? fillTemplate(values.quoteFormat, { text: said }) : "";
  return (
    <div className={`bb-alert in-${values.alertIn} out-${values.alertOut}${leaving ? " leaving" : ""}`}>
      <div className="bb-alert-bear"><Hero choice={values.bearAlerts} poses={POSES} className="bb-hero" /></div>
      <div className="bb-alert-card bb-card">
        <div className="bb-alert-icon"><IconShape name={icon} /></div>
        <div className="bb-alert-text">
          <span className="bb-tag bb-pill">{tag}</span>
          <b className="bb-alert-line">{line}</b>
          {quote && <i className="bb-quote">{quote}</i>}
        </div>
        {values.alertTimer && <div className="bb-timer" aria-hidden="true"><span /></div>}
      </div>
    </div>
  );
}

// fixed: three start values per piece (position, rotation, delay)
const pieceStyle = (index: number) => ({ "--x": hash(index * 3 + 1), "--spin": hash(index * 3 + 2), "--delay": hash(index * 3 + 3) }) as CSSProperties;

// Paw prints and leaves fall over the whole picture; position, rotation and start from hash
function Confetti({ count }: { count: number }) {
  return (
    <div className="bb-confetti" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="bb-piece" style={pieceStyle(index)}>
          <IconShape name={CONFETTI[index % CONFETTI.length]} />
        </div>
      ))}
    </div>
  );
}
