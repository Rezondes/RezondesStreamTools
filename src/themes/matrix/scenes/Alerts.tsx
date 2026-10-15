// Alert-Overlay, transparent. Empfohlen als Browserquelle 1920x1080, Alert erscheint oben mittig.
// Parameter: ?duration=7 (Sekunden pro Alert), ?scale=0.7 (Grösse), ?sound=0, ?volume=0.5, ?demo
import { useEffect } from "react";
import MatrixRain from "../MatrixRain.tsx";
import type { Alert } from "../../../core/types.ts";
import { numberParam } from "../../../core/params.ts";
import { beep } from "../../../core/sound.ts";
import { useAlerts } from "../../../core/hooks/useAlerts.ts";
import { useDecode } from "../../../core/hooks/useDecode.ts";

const DURATION = numberParam("duration", 7) * 1000;
const SCALE = numberParam("scale", 0.7);

const tagged = (tag: string, detail?: string) => (detail ? `${tag} // ${detail.toUpperCase()}` : tag);

function describe(a: Alert): { tag: string; title: string; line: string } {
  const n = a.amount ?? 0;
  switch (a.kind) {
    case "follow": return { tag: "FOLLOW", title: a.user, line: "ist jetzt in der Matrix." };
    case "sub": return { tag: tagged("SUB", a.detail), title: a.user, line: "hat die rote Pille genommen." };
    case "resub": return { tag: tagged(`RESUB x${n}`, a.detail), title: a.user, line: `ist seit ${n} Monaten dabei.` };
    case "gift": return { tag: `GIFT x${n}`, title: a.user, line: n !== 1 ? `verschenkt ${n} Subs an den Chat.` : a.text ? `verschenkt einen Sub an ${a.text}.` : "verschenkt einen Sub." };
    case "raid": return { tag: "RAID", title: a.user, line: `raidet mit ${n} Zuschauern!` };
    case "cheer": return { tag: `${n} BITS`, title: a.user, line: `cheert ${n} Bits.` };
    case "redeem": return { tag: `${n} KANALPUNKTE`, title: a.user, line: `löst "${a.detail}" ein.` };
    case "hype": return a.detail === "end"
      ? { tag: "HYPE TRAIN", title: "HYPE TRAIN", line: `ist auf Level ${n} angekommen. Danke!` }
      : { tag: "HYPE TRAIN", title: "HYPE TRAIN", line: "ist abgefahren! Alle einsteigen." };
  }
}

export default function Alerts() {
  const { current, leaving } = useAlerts(DURATION);
  return <div className="alerts" style={{ "--scale": SCALE } as React.CSSProperties}>{current && <AlertBox key={current.key} alert={current} leaving={leaving} />}</div>;
}

function AlertBox({ alert, leaving }: { alert: Alert; leaving: boolean }) {
  const { tag, title, line } = describe(alert);
  const header = useDecode(`> INCOMING TRANSMISSION // ${tag}`, 550, 18);
  const name = useDecode(title.toUpperCase(), 800, 55);
  const sub = useDecode(line, 1300, 22);
  const quote = useDecode(alert.text && alert.kind !== "gift" ? `"${alert.text}"` : "", 1900, 18);

  // Kleiner Modem-Gruss beim Öffnen, tiefer Ton beim Ausblenden
  useEffect(() => {
    [880, 1320, 660, 1760].forEach((frequency, index) => beep(frequency, 90, index * 85));
    beep(2640, 40, 900);
  }, []);
  useEffect(() => { if (leaving) beep(440, 120); }, [leaving]);

  return (
    <div className={`alert${leaving ? " leaving" : ""}`} style={{ "--d": `${DURATION}ms` } as React.CSSProperties}>
      <div className="alert-body">
        <MatrixRain size={14} className="rain inner" />
        <div className="alert-head">{header}</div>
        <div className="alert-name glow glitch" data-text={name}>{name}</div>
        <div className="alert-line">{sub}</div>
        {quote && <div className="alert-quote muted">{quote}</div>}
        <div className="alert-timer" />
      </div>
    </div>
  );
}
