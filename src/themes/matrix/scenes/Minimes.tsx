// Minimes des Matrix-Themes: eingeklinkte Chatter als Neon-Geister im Kapuzenpulli, ohne Beine, getragen von einer
// Düse aus fallenden Glyphen, mit Namen über dem Kopf. Transparent, empfohlen 1920x360 am unteren Bildrand.
// Wer drin ist und was jeder tut, kommt aus useMinimes; hier stehen das Aussehen und der Katalog der eigenen
// Animationen (backflip, glitch, look, spin, sleep; boost als Reaktion auf Chat). Parameter: ?demo, ?demo=<n>
import { useMemo, useState, type CSSProperties } from "react";
import { glyph } from "../../../core/glyphs.ts";
import { useMinimes } from "../../../core/hooks/useMinimes.ts";
import { actorRun, actorStyle, type MinimeAction, type MinimeActor } from "../../../core/minimeBehavior.ts";
import { useMatrix } from "../useMatrix.ts";
import "../minimes.css";

export default function Minimes() {
  const values = useMatrix();
  // Breite der Szene einmal beim Laden (OBS-Quelle), danach bleibt sie
  const [widthPx] = useState(() => innerWidth);
  const catalog = useMemo<MinimeAction[]>(() => [
    { name: "backflip", durationMs: values.minimeBackflipMs, weight: values.minimeBackflipWeight },
    { name: "glitch", durationMs: values.minimeGlitchMs, weight: values.minimeGlitchWeight },
    { name: "look", durationMs: values.minimeLookMs, weight: values.minimeLookWeight },
    { name: "spin", durationMs: values.minimeSpinMs, weight: values.minimeSpinWeight },
    { name: "sleep", durationMs: values.minimeSleepMs, weight: values.minimeSleepWeight },
  ], [values]);
  const reaction = useMemo<MinimeAction>(() => ({ name: "boost", durationMs: values.minimeBoostMs, weight: 0 }), [values.minimeBoostMs]);
  const actors = useMinimes({ catalog, reaction, widthPx });
  return (
    <div className="minimes" aria-hidden="true">
      {actors.map(actor => <Ghost key={actor.login} actor={actor} />)}
    </div>
  );
}

function Ghost({ actor }: { actor: MinimeActor }) {
  const values = useMatrix();
  const showing = actor.action === "enter" || actor.action === "exit";
  // Lage, Bewegung, Dauer und Blickrichtung aus dem Kern (actorStyle), dazu die Farbe des Geists
  const style = { ...actorStyle(actor), "--minime": actor.color ?? values.minimeDefaultColor } as CSSProperties;
  return (
    <div className={`minime action-${actor.action}`} style={style}>
      {values.minimeNames && <div className="minime-name">{actor.user}</div>}
      <div className="minime-float">
        <div className="minime-flip">
          <div key={actorRun(actor)} className="minime-action">
            <Shape />
            {showing && <Glyphs className="minime-decode" />}
            {actor.action === "sleep" && <Sleep />}
          </div>
          <Glyphs className="minime-jet" />
        </div>
      </div>
    </div>
  );
}

// Der Geist als Linien: Kapuze mit Zipfel, dunkles Gesicht mit zwei Augen, Pulli mit Tasche und Kordeln, Ärmel,
// unten ausgefranst statt Beinen (viewBox 100 x 110)
function Shape() {
  return (
    <svg className="minime-shape" viewBox="0 0 100 110">
      <path className="outline" d="M24 64 C15 70 13 84 16 98 L23 106 L31 99 L39 107 L47 99 L54 107 L62 99 L70 107 L77 99 L84 105 C87 90 85 72 76 64" />
      <path className="outline" d="M22 72 C13 78 11 88 16 94 Q21 96 25 91" />
      <path className="outline" d="M78 72 C87 78 89 88 84 94 Q79 96 75 91" />
      <path className="outline" d="M37 84 L63 84 L59 95 L41 95 Z" />
      <path className="outline" d="M44 64 L42 77 M56 64 L58 77" />
      <path className="outline face" d="M48 7 Q60 -4 66 11 C77 17 82 29 82 43 L82 59 Q82 66 75 66 L25 66 Q18 66 18 59 L18 43 C18 23 31 8 50 5 Z" />
      <path className="hollow" d="M30 45 C30 31 70 31 70 45 L70 55 Q70 61 64 61 L36 61 Q30 61 30 55 Z" />
      <ellipse className="eye" cx="41" cy="49" rx="4.5" ry="6" />
      <ellipse className="eye" cx="59" cy="49" rx="4.5" ry="6" />
    </svg>
  );
}

// Aufsteigende Schlaf-Zeichen über dem Kopf, nacheinander
function Sleep() {
  const values = useMatrix();
  return (
    <div className="minime-sleep">
      {[0, 1].map(index => <span key={index} style={{ "--index": index } as CSSProperties}>{values.minimeSleepText}</span>)}
    </div>
  );
}

// Spalten fallender Glyphen (Düse unter dem Geist, beim Erscheinen und Verschwinden auch über ihm).
// Jede Spalte steht doppelt im Text, damit das Fallen ohne Sprung weiterläuft.
function Glyphs({ className }: { className: string }) {
  const values = useMatrix();
  const columns = useMemo(
    () => Array.from({ length: values.minimeJetColumns }, () => Array.from({ length: values.minimeJetLength }, () => glyph(values.glyphs)).join("")),
    [values.minimeJetColumns, values.minimeJetLength, values.glyphs],
  );
  return (
    <div className={className}>
      {columns.map((column, index) => (
        <span key={index} className="minime-column" style={{ "--column": index } as CSSProperties}>{column + column}</span>
      ))}
    </div>
  );
}
