// Alerts of the standard theme (PLAN-STANDARD.md package 3, prototype refs/alert.html): a rounded card glides in with
// a light spring while its gradient edge draws itself once around (edgeTrace.ts), a soft glow pulses and sparks in
// both accents fly off the edge (pixi/Sparks.tsx). The header fades in, the name rises letter by letter out of a blur,
// line, message and remaining-time bar follow, a shine runs over the bar. The exit blurs and tilts back, glides up or
// fades (alertExit). Built-in chime and fade-out tone (tones.ts), an own file per alert kind replaces them, "Töne"
// switches them off. Texts, quote rule and sounds come from the alerts context of the core (src/core/alerts).
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { type RefObject, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ALERT_SOUND_KEYS, alertQuote, alertTextKeys, describeAlert } from "../../../core/alerts/alerts.ts";
import { useAlertSounds } from "../../../core/alerts/useAlertSounds.ts";
import { seedOf } from "../../../core/hash.ts";
import { useAlerts } from "../../../core/hooks/useAlerts.ts";
import { seekFromQuery } from "../../../core/motion/seek.ts";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import type { Alert } from "../../../core/types.ts";
import { splitName } from "../alertName.ts";
import { perimeter, traceLength } from "../edgeTrace.ts";
import Sparks from "../pixi/Sparks.tsx";
import type { StandardValues } from "../settings.ts";
import { playChime, playLeave } from "../tones.ts";
import { useStandard } from "../useStandard.ts";

// Headers are called <kind>Label here
const KEYS = alertTextKeys("Label");
// fixed: seconds in ms
const SECOND_MS = 1000;
// fixed: when each part starts in s, like the prototype
const AT = { trace: 0.3, burst: 1.0, glow: 1.0, label: 0.55, name: 0.7, line: 1.2, quote: 1.45, shine: 1.6 };
// fixed: where the parts come from (px, scale, blur), like the prototype
const FROM = { cardY: -60, cardScale: 0.96, cardBlur: "blur(8px)", label: 8, char: 30, charBlur: "blur(10px)", line: 10 };
// fixed: durations and staggers in s, like the prototype
const TIME = { card: 0.8, glowUp: 0.25, glowDown: 0.9, label: 0.45, char: 0.7, charStagger: 0.04, line: 0.5, shine: 1 };
// fixed: the shine starts left of the bar and ends right of it, in px
const SHINE = { from: -100, to: 760 };
// fixed: the edge sits half its stroke inside the card, stroke width in px, like the prototype
const RIM = { inset: 1, stroke: 2.5 };
// fixed: percent of the gradient each letter of the name moves on
const PERCENT = 100;
// fixed: class of the exit per choice
const EXITS: Record<string, string> = { Unschärfe: "exit-blur", Gleiten: "exit-glide", Blenden: "exit-fade" };
const SEEK = seekFromQuery(location.search);

type Size = { width: number; height: number };

export default function Alerts() {
  const values = useStandard();
  const { current, leaving } = useAlerts(values.alertDuration);
  return <div className="standard-alerts">{current && <Card key={current.key} alert={current} leaving={leaving} />}</div>;
}

// The gradient edge, drawn every frame from the clock (traceLength); without alertTraceOn it stands at once
function Edge({ size, clock, values }: { size: Size; clock: () => number; values: StandardValues }) {
  const rim = useRef<SVGRectElement>(null);
  const gradient = useId();
  const [width, height] = [size.width - RIM.inset - RIM.inset, size.height - RIM.inset - RIM.inset];
  const length = perimeter(width, height, values.radius);
  useEffect(() => {
    const draw = () => rim.current?.style.setProperty("stroke-dashoffset", String(values.alertTraceOn ? length - traceLength(clock() - AT.trace, values.alertTraceMs, length) : 0));
    draw();
    gsap.ticker.add(draw);
    return () => gsap.ticker.remove(draw);
  }, [clock, length, values.alertTraceOn, values.alertTraceMs]);
  return (
    <svg className="standard-alert-edge" aria-hidden="true">
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: "var(--accent)" }} />
          <stop offset="1" style={{ stopColor: "var(--accent2)" }} />
        </linearGradient>
      </defs>
      <rect ref={rim} x={RIM.inset} y={RIM.inset} width={width} height={height} rx={values.radius} fill="none" stroke={`url(#${gradient})`} strokeWidth={RIM.stroke} strokeDasharray={length} />
    </svg>
  );
}

// The entrance of the card, like the prototype
function useEntrance(scope: RefObject<HTMLDivElement | null>, hasName: boolean) {
  useTimeline(timeline => {
    timeline.fromTo(".standard-alert", { y: FROM.cardY, opacity: 0, scale: FROM.cardScale, filter: FROM.cardBlur }, { y: 0, opacity: 1, scale: 1, filter: "blur(0px)", duration: TIME.card, ease: "back.out(1.6)" }, 0);
    timeline.fromTo(".standard-alert-glow", { opacity: 0 }, { keyframes: [{ opacity: 1, duration: TIME.glowUp }, { opacity: 0.25, duration: TIME.glowDown }], ease: "power1.out" }, AT.glow);
    timeline.from(".standard-alert-label", { opacity: 0, y: FROM.label, duration: TIME.label, ease: "power2.out" }, AT.label);
    if (hasName) {
      const chars = SplitText.create(".standard-alert-name", { type: "chars" }).chars as HTMLElement[];
      chars.forEach((char, index) => { char.style.backgroundPosition = `${(index / Math.max(1, chars.length - 1)) * PERCENT}% 0`; });
      timeline.from(chars, { opacity: 0, y: FROM.char, filter: FROM.charBlur, duration: TIME.char, ease: "power3.out", stagger: TIME.charStagger }, AT.name);
    }
    timeline.from(".standard-alert-line", { opacity: 0, y: FROM.line, duration: TIME.line, ease: "power2.out" }, AT.line);
    timeline.from(".standard-alert-quote", { opacity: 0, y: FROM.line, duration: TIME.line, ease: "power2.out" }, AT.quote);
    timeline.fromTo(".standard-alert-shine", { x: SHINE.from }, { x: SHINE.to, duration: TIME.shine, ease: "power1.inOut" }, AT.shine);
  }, [hasName], scope);
}

function Card({ alert, leaving }: { alert: Alert & { key: number }; leaving: boolean }) {
  const values = useStandard();
  const sound = values[ALERT_SOUND_KEYS[alert.kind]];
  const closing = values.soundLeave;
  useAlertSounds(values.alertSound ? () => playChime(sound) : null, values.alertSound ? () => playLeave(closing) : null, leaving);
  const { tag, line } = describeAlert(alert, values, KEYS);
  const { name, rest } = splitName(line, alert.user);
  const quote = values.alertMessage ? alertQuote(alert) : null;
  const scope = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size | null>(null);
  const startedAt = useRef(performance.now());
  const clock = useCallback(() => SEEK ?? (performance.now() - startedAt.current) / SECOND_MS, []);
  useLayoutEffect(() => {
    const card = scope.current?.firstElementChild as HTMLElement | null;
    if (card) setSize({ width: card.offsetWidth, height: card.offsetHeight });
  }, []);
  useEntrance(scope, name !== "");
  return (
    <div ref={scope} className="standard-alert-scope">
      <div className={`standard-alert${leaving ? ` leaving ${EXITS[values.alertExit] ?? "exit-blur"}` : ""}`}>
        <div className="standard-alert-glow" />
        {size && <Edge size={size} clock={clock} values={values} />}
        {size && <Sparks size={size} clock={clock} values={values} seed={seedOf(alert.user) + alert.key} burstAt={AT.burst} />}
        <span className="standard-alert-label">{tag}</span>
        {name && <div className="standard-alert-name">{name}</div>}
        <div className="standard-alert-line">{rest}</div>
        {quote && <div className="standard-alert-quote">{quote}</div>}
        {values.alertProgress && <div className="standard-alert-bar" aria-hidden="true"><span className="standard-timer" /><span className="standard-alert-shine" /></div>}
      </div>
    </div>
  );
}
