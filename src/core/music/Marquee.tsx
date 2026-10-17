// Scrolling text for one line: if it does not fit its frame, it moves back and forth at speed px per second, so
// every character is visible once. Measuring (useOverflow) and duration (marqueeSeconds) are the same for all themes;
// the theme gives the class, the look (font, color, weight) comes from its CSS. enabled: false = leave it
// cut off.
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
