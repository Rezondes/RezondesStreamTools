// Alerts des Standard-Themes: eine abgerundete Karte mit Verlaufskante, Kopfzeile je Alert-Art, Zeile mit dem Namen,
// optional der Nachricht und einem Restzeit-Balken. Ton nur mit eigener Datei.
import { useEffect, useState } from "react";
import type { Alert, AlertKind } from "../../../core/types.ts";
import { useAlerts } from "../../../core/hooks/useAlerts.ts";
import { playSound } from "../../../core/sound.ts";
import { fillTemplate } from "../../../core/template.ts";
import type { StandardValues } from "../settings.ts";
import { useStandard } from "../useStandard.ts";

const TEXTS = {
  follow: ["followLabel", "followLine"],
  sub: ["subLabel", "subLine"],
  resub: ["resubLabel", "resubLine"],
  gift: ["giftLabel", "giftLine"],
  raid: ["raidLabel", "raidLine"],
  cheer: ["cheerLabel", "cheerLine"],
  redeem: ["redeemLabel", "redeemLine"],
  hype: ["hypeLabel", "hypeBeginLine"],
} as const satisfies Record<AlertKind, readonly [keyof StandardValues, keyof StandardValues]>;

function describe(alert: Alert, values: StandardValues) {
  const [label, line] = TEXTS[alert.kind];
  const text = alert.kind === "hype" && alert.detail === "end" ? values.hypeEndLine : values[line];
  return { label: values[label], line: fillTemplate(text, { user: alert.user, amount: alert.amount ?? 0, detail: alert.detail ?? "", text: alert.text ?? "" }) };
}

export default function Alerts() {
  const values = useStandard();
  const { current, leaving } = useAlerts(values.alertDuration);
  return <div className="standard-alerts">{current && <Card key={current.key} alert={current} leaving={leaving} />}</div>;
}

function Card({ alert, leaving }: { alert: Alert; leaving: boolean }) {
  const values = useStandard();
  const [sound] = useState(() => values.alertSound);
  useEffect(() => { playSound(sound, () => {}); }, [sound]);
  const { label, line } = describe(alert, values);
  return (
    <div className={`standard-card standard-alert${leaving ? " leaving" : ""}`}>
      <span className="standard-chip">{label}</span>
      <div className="standard-line">{line}</div>
      {values.alertMessage && alert.text && alert.kind !== "gift" && <div className="standard-muted">{alert.text}</div>}
      {values.alertProgress && <div className="standard-timer" aria-hidden="true" />}
    </div>
  );
}
