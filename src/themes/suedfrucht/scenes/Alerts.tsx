// Alerts des Südfrucht-Themes: Postkarte mit Briefmarke und Poststempel, Surfbrett auf einer Welle oder Flaschenpost,
// je Alert-Art Kopfzeile, Zeile, Symbol und Ton; dazu Hibiskus-Konfetti, Wasserspritzer und die Restzeit als Seil.
// Parameter: ?sound=0, ?volume=0.5
import { useEffect, useState, type CSSProperties } from "react";
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
const TEXTS = {
  follow: ["followTag", "followLine", "followIcon", "soundFollow"],
  sub: ["subTag", "subLine", "subIcon", "soundSub"],
  resub: ["resubTag", "resubLine", "resubIcon", "soundResub"],
  gift: ["giftTag", "giftLine", "giftIcon", "soundGift"],
  raid: ["raidTag", "raidLine", "raidIcon", "soundRaid"],
  cheer: ["cheerTag", "cheerLine", "cheerIcon", "soundCheer"],
  redeem: ["redeemTag", "redeemLine", "redeemIcon", "soundRedeem"],
  hype: ["hypeTag", "hypeBeginLine", "hypeIcon", "soundHype"],
} as const satisfies Record<AlertKind, readonly [Key, Key, Key, Key]>;

// fixed: Anzahl der Wassertropfen beim Spritzer
const DROPS = 9;

function describe(alert: Alert, values: SuedfruchtValues) {
  const [tag, line, icon, sound] = TEXTS[alert.kind];
  const text = alert.kind === "hype" && alert.detail === "end" ? values.hypeEndLine : values[line];
  const fill = { user: alert.user, amount: alert.amount ?? 0, detail: alert.detail ?? "", text: alert.text ?? "" };
  return { tag: fillTemplate(values[tag], fill), line: fillTemplate(text, fill), icon: values[icon] as IconName, sound: values[sound] };
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
  const [opening] = useState(() => sound);
  const [closing] = useState(() => values.soundLeave);
  const sounds = values.alertSound;
  useEffect(() => { if (sounds) playChime(opening); }, [sounds, opening]);
  useEffect(() => { if (sounds && leaving) playLeave(closing); }, [sounds, leaving, closing]);
  const quote = values.alertQuote && alert.text && alert.kind !== "gift" ? fillTemplate(values.quoteFormat, { text: alert.text }) : "";
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

// Lage, Drehung und Start einer Blüte, je Blüte drei eigene Werte aus hash
// fixed: drei Startwerte je Blüte (Lage, Drehung, Verzögerung)
const petalStyle = (index: number) => ({ "--x": hash(index * 3 + 1), "--spin": hash(index * 3 + 2), "--delay": hash(index * 3 + 3) }) as CSSProperties;

// Hibiskusblüten fallen über das ganze Bild; Lage, Drehung und Start aus hash, damit jede Blüte anders fällt
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
