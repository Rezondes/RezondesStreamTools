// Radio set of the KOTH alert (refs/alert.html): a steel device with LED, channel and grille slams open from the dog tag,
// its display shows static, then the head line types, the name decodes and the line types in; the remaining time runs
// as warning stripes. Leaving: static again and the radio closes. Everything follows the time of the alert.
import { type CSSProperties, useEffect, useRef } from "react";
import { hash } from "../../../core/hash.ts";
import { type Step, stepShare } from "../build.ts";
import { scrambled, typed } from "../briefing.ts";
import { type AlertSteps, leaveSteps } from "../dogtag.ts";

type Props = {
  time: number; steps: AlertSteps; leftFor: number | null; closeMs: number; timer: Step | null;
  channel: string; tag: string; name: string; line: string; at: { left: number; top: number }; width: number; scale: number;
};

// fixed: blink of the LED, the steps of the static, its frame rate and its grain
const BLINK = 0.12;
const NOISE_STEPS = 4;
const TICKS = 30;
const GRAIN = { width: 240, height: 60, low: 40, range: 140 };

// Static of the display, drawn again only when its frame changes
function Noise({ tick, opacity }: { tick: number; opacity: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const paint = canvas.current?.getContext("2d");
    if (!paint || opacity === 0) return;
    const image = paint.createImageData(GRAIN.width, GRAIN.height);
    for (let pixel = 0; pixel < image.data.length; pixel += 4) {
      const light = GRAIN.low + hash(tick * 7919 + pixel) * GRAIN.range;
      image.data.set([light * 0.55, light, light * 0.5, 255], pixel);
    }
    paint.putImageData(image, 0, 0);
  }, [tick, opacity]);
  return <canvas ref={canvas} className="kh-radio-noise" width={GRAIN.width} height={GRAIN.height} style={{ opacity }} />;
}

// How strong the static is: full while the radio opens, then it fades in steps; leaving it comes back
function noiseOf(time: number, steps: AlertSteps, leftFor: number | null, closeMs: number) {
  if (leftFor !== null) return Math.ceil(stepShare(leaveSteps(closeMs).noise, leftFor) * NOISE_STEPS) / NOISE_STEPS;
  return 1 - Math.floor(stepShare(steps.noise, time) * NOISE_STEPS) / NOISE_STEPS;
}

export default function RadioSet({ time, steps, leftFor, closeMs, timer, channel, tag, name, line, at, width, scale }: Props) {
  const open = stepShare(steps.radio, time);
  const closed = leftFor === null ? 0 : stepShare(leaveSteps(closeMs).radio, leftFor);
  const clip = closed > 0 ? `inset(0 0 0 ${closed * 100}%)` : `inset(-20px ${(1 - open) * 100}% -60px -20px)`;
  const blinking = time >= steps.led.start && time < steps.led.start + steps.led.duration;
  const led = !blinking || Math.floor((time - steps.led.start) / BLINK) % 2 === 0;
  const style = { left: at.left, top: at.top, width, transform: `scale(${scale})`, clipPath: clip, visibility: time >= steps.radio.start ? "visible" : "hidden" } as CSSProperties;
  return (
    <div className="kh-radio" style={style}>
      <div className="kh-radio-bar"><span><i className={`kh-led${led ? " on" : ""}`} />{channel}</span><span className="kh-grille" /></div>
      <div className="kh-radio-panel">
        <Noise tick={Math.floor(time * TICKS)} opacity={noiseOf(time, steps, leftFor, closeMs)} />
        <p className="kh-radio-tag">{typed(tag, stepShare(steps.tag, time))}</p>
        <b className="kh-radio-name">{stepShare(steps.name, time) > 0 ? scrambled(name, stepShare(steps.name, time), Math.floor(time * TICKS)) : ""}</b>
        <p className="kh-radio-text">{typed(line, stepShare(steps.line, time))}</p>
      </div>
      {timer && <i className="kh-radio-timer" style={{ transform: `scaleX(${1 - stepShare(timer, time)})` }} />}
    </div>
  );
}
