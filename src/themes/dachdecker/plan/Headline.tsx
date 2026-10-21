// Head lines of the Dachdecker screens (DESIGN-DACHDECKER.md "Szenen"): the head line top left (first part white and
// bold, the rest in copper, // between the parts), the title with its subtitle and the big number in terracotta at the
// bottom middle. Head fades in, title and number decode from the left as the clock of the scene says; the title
// flickers now and then like a lamp over the drawing board (theme.css).
import type { CSSProperties } from "react";
import { reached, type Schedule } from "../schedule.ts";
import { DIGITS, LETTERS, SCRAMBLE_RATE, scrambled } from "./scramble.ts";

type Props = {
  head: string; title: string; subtitle: string; big: string;
  time: number; schedule: Schedule; scramble: boolean; flicker: boolean;
};

const shown = (start: number, time: number) => ({ opacity: time >= start ? 1 : 0 });
const eased = (part: number) => 1 - (1 - part) ** 3;

export default function Headline({ head, title, subtitle, big, time, schedule, scramble, flicker }: Props) {
  const [first, ...rest] = head.split("//").map(part => part.trim()).filter(Boolean);
  const tick = Math.floor(time * SCRAMBLE_RATE);
  const decode = (text: string, step: keyof Schedule) =>
    scramble ? scrambled(text, reached(schedule[step], time), tick, /^[\d:\s]+$/.test(text) ? DIGITS : LETTERS) : text;
  return (
    <>
      {first && (
        <p className="dd-head" style={{ opacity: reached(schedule.head, time) }}>
          <b>{first}</b>
          {rest.map((part, index) => <span key={index} className="dd-head-part">{part}</span>)}
        </p>
      )}
      <div className="dd-center">
        {/* The flicker runs on the inner span: an animation on the title would override its fade */}
        <h1 className="dd-title" style={shown(schedule.title.start, time)}><span className={flicker ? "dd-flicker" : undefined}>{decode(title, "title")}</span></h1>
        {/* The subtitle fades in while its wide letter spacing closes */}
        {subtitle && <p className="dd-subtitle" style={{ opacity: reached(schedule.subtitle, time), "--spread": 1 - eased(reached(schedule.subtitle, time)) } as CSSProperties}>{subtitle}</p>}
        <b className="dd-big" style={shown(schedule.count.start, time)}>{decode(big, "count")}</b>
      </div>
    </>
  );
}
