// Lauftext für eine Zeile: passt sie nicht in ihren Rahmen, fährt sie mit speed px pro Sekunde hin und her, sodass
// jedes Zeichen einmal zu sehen ist. Messung (useOverflow) und Dauer (marqueeSeconds) sind für alle Themes gleich;
// das Theme gibt die Klasse, das Aussehen (Schrift, Farbe, Gewicht) kommt aus seinem CSS. enabled: false = abgeschnitten
// stehen lassen.
import type { CSSProperties } from "react";
import { marqueeSeconds } from "./music.ts";
import { useOverflow } from "./useOverflow.ts";
import "./marquee.css";

type Props = { text: string; speed: number; className?: string; enabled?: boolean };

export default function Marquee({ text, speed, className = "", enabled = true }: Props) {
  const { outer, inner, overflow } = useOverflow<HTMLSpanElement, HTMLSpanElement>(text);
  const moving = enabled && overflow > 0;
  const style = { "--shift": `-${overflow}px`, "--marquee-time": `${marqueeSeconds(overflow, speed)}s` } as CSSProperties;
  return (
    <span ref={outer} className={`marquee ${className}`}>
      <span ref={inner} className={`marquee-text${moving ? " moving" : ""}`} style={style}>{text}</span>
    </span>
  );
}
