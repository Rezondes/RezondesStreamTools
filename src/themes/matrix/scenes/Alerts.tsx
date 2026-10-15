// Alert-Overlay, transparent. Empfohlen als Browserquelle 1920x1080. Texte je Alert-Art, Position, Grösse, Dauer,
// Animationen und Töne kommen aus den Einstellungen. Parameter: ?sound=0, ?volume=0.5, ?demo
import { useEffect, useState } from "react";
import MatrixRain from "../MatrixRain.tsx";
import type { Alert, AlertKind } from "../../../core/types.ts";
import { fillTemplate } from "../../../core/template.ts";
import { useAlerts } from "../../../core/hooks/useAlerts.ts";
import { useMatrixDecode } from "../decode.ts";
import { playLeave, playOpen } from "../tones.ts";
import { useMatrix } from "../values.ts";
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

// Kopfzeile, Name und Zeile eines Alerts aus den Texten der Einstellungen
function describe(alert: Alert, values: MatrixValues): { tag: string; title: string; line: string } {
  const amount = alert.amount ?? 0;
  const fill = (text: string) => fillTemplate(text, { user: alert.user, amount, detail: alert.detail ?? "", text: alert.text ?? "" });
  const tier = alert.detail ? fillTemplate(values.tierSuffix, { detail: alert.detail.toUpperCase() }) : "";
  const shown = (tag: string, line: string, title = alert.user) => ({ tag: fill(tag), title, line: fill(line) });
  switch (alert.kind) {
    case "follow": return shown(values.followTag, values.followLine);
    case "sub": return shown(values.subTag + tier, values.subLine);
    case "resub": return shown(values.resubTag + tier, values.resubLine);
    case "gift": return shown(values.giftTag, amount !== 1 ? values.giftLine : alert.text ? values.giftToLine : values.giftOneLine);
    case "raid": return shown(values.raidTag, values.raidLine);
    case "cheer": return shown(values.cheerTag, values.cheerLine);
    case "redeem": return shown(values.redeemTag, values.redeemLine);
    case "hype": return shown(values.hypeTag, alert.detail === "end" ? values.hypeEndLine : values.hypeBeginLine, values.hypeTitle);
  }
}

export default function Alerts() {
  const values = useMatrix();
  const { current, leaving } = useAlerts(values.alertDuration);
  return <div className={`alerts align-${values.alertAlign}`}>{current && <AlertBox key={current.key} alert={current} leaving={leaving} />}</div>;
}

function AlertBox({ alert, leaving }: { alert: Alert; leaving: boolean }) {
  const values = useMatrix();
  const { tag, title, line } = describe(alert, values);
  const header = useMatrixDecode(fillTemplate(values.alertHeader, { tag }), "alertHeader");
  const name = useMatrixDecode(title.toUpperCase(), "alertName");
  const sub = useMatrixDecode(line, "alertLine");
  const withQuote = values.alertQuote && alert.text && alert.kind !== "gift";
  const quote = useMatrixDecode(withQuote ? fillTemplate(values.quoteFormat, { text: alert.text ?? "" }) : "", "alertQuote");

  // Ton beim Öffnen genau einmal pro Alert, beim Ausblenden einmal
  const [openSound] = useState(() => (values.alertSound ? values[SOUND[alert.kind]] : null));
  useEffect(() => { if (openSound) playOpen(openSound); }, [openSound]);
  const leaveSound = values.alertSound ? values.soundLeave : null;
  useEffect(() => { if (leaving && leaveSound) playLeave(leaveSound); }, [leaving, leaveSound]);

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
