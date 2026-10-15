// Alerts des Starter-Themes: eine Karte mit einer Zeile je Alert-Art und optional der Nachricht, für die eingestellte
// Dauer. Nutzt nur Kern-Hooks (useAlerts) und die Werte des Themes; Ton nur mit eigener Datei.
import { useEffect, useState } from "react";
import type { Alert, AlertKind } from "../../../core/types.ts";
import { useAlerts } from "../../../core/hooks/useAlerts.ts";
import { playSound } from "../../../core/sound.ts";
import { fillTemplate } from "../../../core/template.ts";
import type { StarterValues } from "../settings.ts";
import { useStarter } from "../useStarter.ts";

const LINES = {
  follow: "followLine",
  sub: "subLine",
  resub: "resubLine",
  gift: "giftLine",
  raid: "raidLine",
  cheer: "cheerLine",
  redeem: "redeemLine",
  hype: "hypeBeginLine",
} as const satisfies Record<AlertKind, keyof StarterValues>;

const lineOf = (alert: Alert, values: StarterValues) => (alert.kind === "hype" && alert.detail === "end" ? values.hypeEndLine : values[LINES[alert.kind]]);

export default function Alerts() {
  const values = useStarter();
  const { current, leaving } = useAlerts(values.alertDuration);
  return <div className="starter-alerts">{current && <Card key={current.key} alert={current} leaving={leaving} />}</div>;
}

function Card({ alert, leaving }: { alert: Alert; leaving: boolean }) {
  const values = useStarter();
  const [sound] = useState(() => values.alertSound);
  useEffect(() => { playSound(sound, () => {}); }, [sound]);
  const line = fillTemplate(lineOf(alert, values), { user: alert.user, amount: alert.amount ?? 0, detail: alert.detail ?? "", text: alert.text ?? "" });
  return (
    <div className={`starter-card${leaving ? " leaving" : ""}`}>
      <div className="starter-line">{line}</div>
      {values.alertMessage && alert.text && alert.kind !== "gift" && <div className="starter-message">{alert.text}</div>}
    </div>
  );
}
