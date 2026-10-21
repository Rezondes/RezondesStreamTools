// Alert overlay, transparent. Recommended as browser source 1920x1080. Texts per alert kind, position, size, duration,
// animations and sounds come from the settings. Texts, quote rule and sounds come from the alerts context of the core
// (src/core/alerts), here only the keys of the texts and the matrix look. A rain curtain pours over the place of the box,
// the box switches on there like a tube, glitches once in the middle and at the end falls apart into glyphs
// (PLAN-MATRIX.md package 3, pixi/Curtain.tsx), all on one GSAP timeline (stills with ?t=).
// Parameters: ?sound=0, ?volume=0.5, ?demo
import { type RefObject, useLayoutEffect, useRef, useState } from "react";
import { alertTiming } from "../../../core/overlayTiming.ts";
import { useTimeline } from "../../../core/motion/useTimeline.ts";
import { glitchKeys, GLITCH, powerOn } from "../crtMotion.ts";
import { type Area, curtainLength } from "../curtain.ts";
import Curtain, { type CurtainClock } from "../pixi/Curtain.tsx";
import Rain from "../pixi/Rain.tsx";
import type { MatrixValues } from "../settings.ts";
import { ALERT_SOUND_KEYS, alertQuote, alertTextKeys, describeAlert } from "../../../core/alerts/alerts.ts";
import { useAlertSounds } from "../../../core/alerts/useAlertSounds.ts";
import type { Alert } from "../../../core/types.ts";
import { fillTemplate } from "../../../core/template.ts";
import { useAlerts } from "../../../core/hooks/useAlerts.ts";
import { useMatrixDecode } from "../useMatrixDecode.ts";
import { playLeave, playOpen } from "../tones.ts";
import { useMatrix } from "../useMatrix.ts";

// Texts following the usual pattern, plus matrix-specific: single gift sub and sub tier in upper case
const KEYS = alertTextKeys("Tag", { giftOneLine: "giftOneLine", giftToLine: "giftToLine", tierSuffix: "tierSuffix", tierUpper: true });

export default function Alerts() {
  const values = useMatrix();
  const { current, leaving } = useAlerts(values.alertDuration);
  return <div className={`alerts align-${values.alertAlign}`}>{current && <AlertBox key={current.key} alert={current} leaving={leaving} />}</div>;
}

const SECOND_MS = 1000; // fixed: seconds in ms
const DAY = 86400; // fixed: how long the clock of an alert runs (s)
const MIDDLE = 0.5; // fixed: the glitch comes halfway to the leaving

// The clock of the curtain, the power on of the box after it, the glitch in the middle and the box vanishing when it
// dissolves
function useAlertMotion(scope: RefObject<HTMLDivElement | null>, values: MatrixValues, clock: CurtainClock) {
  useTimeline(timeline => {
    const body = scope.current?.querySelector(".alert-body");
    if (!body) return;
    clock.time = 0;
    clock.leaveAt = alertTiming(values.alertDuration).leaveAtMs / SECOND_MS;
    timeline.to(clock, { time: DAY, duration: DAY, ease: "none" }, 0);
    if (values.alertCurtainOn) powerOn(timeline, body, curtainLength(values.alertCurtainSpeed), values.alertCrtOnMs / SECOND_MS);
    if (values.alertGlitchOn) timeline.to(body, { keyframes: glitchKeys(), duration: GLITCH.length, ease: "steps(3)" }, clock.leaveAt * MIDDLE);
    if (values.alertDissolveOn) timeline.set(body, { opacity: 0 }, clock.leaveAt);
  }, [values.alertDuration, values.alertCurtainOn, values.alertCurtainSpeed, values.alertCrtOnMs, values.alertGlitchOn, values.alertDissolveOn], scope);
}

// The size of the box once it is laid out (the curtain and its rain are drawn in it)
function useBoxArea(scope: RefObject<HTMLDivElement | null>) {
  const [area, setArea] = useState<Area | null>(null);
  useLayoutEffect(() => {
    const body = scope.current?.querySelector<HTMLElement>(".alert-body");
    if (body) setArea({ width: body.offsetWidth, height: body.offsetHeight });
  }, [scope]);
  return area;
}

function AlertBox({ alert, leaving }: { alert: Alert; leaving: boolean }) {
  const values = useMatrix();
  const { tag, line } = describeAlert(alert, values, KEYS);
  // Matrix-specific: the hype train has its own title instead of a name
  const title = alert.kind === "hype" ? values.hypeTitle : alert.user;
  const header = useMatrixDecode(fillTemplate(values.alertHeader, { tag }), "alertHeader");
  const name = useMatrixDecode(title.toUpperCase(), "alertName");
  const sub = useMatrixDecode(line, "alertLine");
  const said = values.alertQuote ? alertQuote(alert) : null;
  const quote = useMatrixDecode(said ? fillTemplate(values.quoteFormat, { text: said }) : "", "alertQuote");
  const opening = values[ALERT_SOUND_KEYS[alert.kind]];
  const closing = values.soundLeave;
  useAlertSounds(values.alertSound ? () => playOpen(opening) : null, values.alertSound ? () => playLeave(closing) : null, leaving);
  const scope = useRef<HTMLDivElement>(null);
  const clock = useRef<CurtainClock>({ time: 0, leaveAt: Number.POSITIVE_INFINITY }).current;
  useAlertMotion(scope, values, clock);
  const area = useBoxArea(scope);
  const enter = values.alertCurtainOn ? "curtain" : values.alertIn;
  const exit = values.alertDissolveOn ? "dissolve" : values.alertOut;

  return (
    <div ref={scope} className={`alert in-${enter} out-${exit}${leaving ? " leaving" : ""}`}>
      <div className="alert-body">
        {values.rainAlerts && area && <Rain opacity={values.rainOpacityAlerts} area={area} />}
        <div className="alert-head">{header}</div>
        <div className="alert-name glow glitch" data-text={name}>{name}</div>
        <div className="alert-line">{sub}</div>
        {quote && <div className="alert-quote muted">{quote}</div>}
        {values.alertTimer && <div className="alert-timer" />}
      </div>
      {area && (values.alertCurtainOn || values.alertDissolveOn) && <Curtain area={area} clock={clock} />}
    </div>
  );
}
