// Radio set of the KOTH alert (refs/alert.html): a steel device with LED, channel and grille slams open from the dog tag,
// its display shows static, then the head line types, the name decodes and the line types in; the remaining time runs
// as warning stripes. Leaving: static again and the radio closes. Everything follows the time of the alert. The name
// stays on one line and shrinks when it would not fit; the line and the viewer's message wrap and keep the room of their
// whole text while they type, so the radio does not grow letter by letter.
import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from "react";
import { hash } from "../../../core/hash.ts";
import { type Step, stepShare } from "../build.ts";
import { scrambled, typed } from "../briefing.ts";
import { type AlertSteps, leaveSteps } from "../dogtag.ts";
import { useKoth } from "../useKoth.ts";

type Props = {
  time: number; steps: AlertSteps; leftFor: number | null; closeMs: number; timer: Step | null;
  channel: string; tag: string; name: string; line: string; quote: string; at: { left: number; top: number }; width: number; scale: number; nameSize: number;
};

// fixed: the size of the grain; the blink of the LED, the steps of the static, its frame rate and its light come from the
// settings
const GRAIN = { width: 240, height: 60 };

// Static of the display, drawn again only when its frame changes
function Noise({ tick, opacity }: { tick: number; opacity: number }) {
  const values = useKoth();
  const low = values.radioGrainLow;
  const range = values.radioGrainRange;
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const paint = canvas.current?.getContext("2d");
    if (!paint || opacity === 0) return;
    const image = paint.createImageData(GRAIN.width, GRAIN.height);
    for (let pixel = 0; pixel < image.data.length; pixel += 4) {
      const light = low + hash(tick * 7919 + pixel) * range;
      image.data.set([light * 0.55, light, light * 0.5, 255], pixel);
    }
    paint.putImageData(image, 0, 0);
  }, [tick, opacity, low, range]);
  return <canvas ref={canvas} className="kh-radio-noise" width={GRAIN.width} height={GRAIN.height} style={{ opacity }} />;
}

// How strong the static is: full while the radio opens, then it fades in steps; leaving it comes back
function noiseOf(time: number, steps: AlertSteps, leftFor: number | null, closeMs: number, noiseSteps: number) {
  if (leftFor !== null) return Math.ceil(stepShare(leaveSteps(closeMs).noise, leftFor) * noiseSteps) / noiseSteps;
  return 1 - Math.floor(stepShare(steps.noise, time) * noiseSteps) / noiseSteps;
}

// A text that types in: the whole text keeps its room unseen, the typed part lies on top of it
function Typed({ className, text, count }: { className: string; text: string; count: number }) {
  return <p className={className}><span className="kh-radio-room">{text}</span><span className="kh-radio-typed">{text.slice(0, Math.max(0, count))}</span></p>;
}

// How much of the set name size the name gets: all of it, or less when the name would be wider than the panel
function useNameFit(name: string, size: number) {
  const measure = useRef<HTMLElement>(null);
  const [fit, setFit] = useState(1);
  useLayoutEffect(() => {
    const element = measure.current;
    const room = element?.parentElement;
    if (!element || !room) return;
    const style = getComputedStyle(room);
    const inner = room.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    setFit(Math.min(1, inner / element.scrollWidth));
  }, [name, size]);
  return { measure, fit };
}

export default function RadioSet({ time, steps, leftFor, closeMs, timer, channel, tag, name, line, quote, at, width, scale, nameSize }: Props) {
  const { measure, fit } = useNameFit(name, nameSize);
  const { ledBlink, radioNoiseSteps, radioTicks } = useKoth();
  // The line and then the message type in one run
  const shown = Math.round(stepShare(steps.line, time) * (line.length + quote.length));
  const open = stepShare(steps.radio, time);
  const closed = leftFor === null ? 0 : stepShare(leaveSteps(closeMs).radio, leftFor);
  const clip = closed > 0 ? `inset(0 0 0 ${closed * 100}%)` : `inset(-20px ${(1 - open) * 100}% -60px -20px)`;
  const blinking = time >= steps.led.start && time < steps.led.start + steps.led.duration;
  const led = !blinking || Math.floor((time - steps.led.start) / ledBlink) % 2 === 0;
  const style = { left: at.left, top: at.top, width, transform: `scale(${scale})`, clipPath: clip, visibility: time >= steps.radio.start ? "visible" : "hidden" } as CSSProperties;
  return (
    <div className="kh-radio" style={style}>
      <div className="kh-radio-bar"><span><i className={`kh-led${led ? " on" : ""}`} />{channel}</span><span className="kh-grille" /></div>
      <div className="kh-radio-panel">
        <Noise tick={Math.floor(time * radioTicks)} opacity={noiseOf(time, steps, leftFor, closeMs, radioNoiseSteps)} />
        <p className="kh-radio-tag">{typed(tag, stepShare(steps.tag, time))}</p>
        <b className="kh-radio-name" style={{ fontSize: nameSize * fit }}>{stepShare(steps.name, time) > 0 ? scrambled(name, stepShare(steps.name, time), Math.floor(time * radioTicks)) : " "}</b>
        <b ref={measure} className="kh-radio-name kh-radio-measure" style={{ fontSize: nameSize }} aria-hidden="true">{name}</b>
        <Typed className="kh-radio-text" text={line} count={shown} />
        {quote && <Typed className="kh-radio-text kh-radio-quote" text={quote} count={shown - line.length} />}
      </div>
      {timer && <i className="kh-radio-timer" style={{ transform: `scaleX(${1 - stepShare(timer, time)})` }} />}
    </div>
  );
}
