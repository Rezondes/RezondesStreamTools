// Starting scene of the KOTH theme (PLAN-KOTH.md package 2, DESIGN-KOTH.md "Modernisierung"): the hill as a 3D world
// with radio mast, flag, camp and smoke that builds itself while the camera pulls back and circles; on top the briefing:
// the call in the head line, the clock, the briefing map that draws itself, the stencil title stamped letter by letter,
// the radio display with the decoding countdown, the radio lines, the factions and warning stripes as progress. One
// clock drives everything: the GSAP timeline runs it, the 3D parts read it every frame, the briefing follows it until
// it is revealed. Still image: ?t=<seconds>. Parameters per source: ?min=5, ?at=20:00, ?ticker=...
import { type CSSProperties, useMemo, useState } from "react";
import { shortClock } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import { fillTemplate } from "../../../core/template.ts";
import BriefingMap from "../briefing/BriefingMap.tsx";
import RadioDisplay from "../briefing/RadioDisplay.tsx";
import RadioLines from "../briefing/RadioLines.tsx";
import { type KothClock, type Steps, startingSteps, stepShare } from "../build.ts";
import { TEAM_SET, type KothValues } from "../settings.ts";
import World from "../three/World.tsx";
import { useClockValue, useRunClock } from "../useClock.ts";
import { kothNames, teamColor, teamLabel, useKoth } from "../useKoth.ts";

type Screen = ReturnType<typeof useScreen>;
type Parts = { values: KothValues; clock: KothClock; steps: Steps; screen: Screen };

// fixed: the stamp of a title letter (scale at the start, curve power4.in)
const STAMP = { scale: 1.8, power: 4 };
const CHANNEL = "{channel}";

// Head line: the call of the alerts with the channel name in the signal color, then the overline
function Head({ values, opacity }: { values: KothValues; opacity: number }) {
  const [before, ...after] = values.alertCallsign.split(CHANNEL);
  const names = kothNames(values);
  return (
    <p className="kh-head" style={{ opacity }}>
      {fillTemplate(before, names)}
      {after.length > 0 && <b>{values.channelName}</b>}
      {fillTemplate(after.join(CHANNEL), names)} // {values.startingEyebrow}
    </p>
  );
}

function Title({ text, time, steps }: { text: string; time: number; steps: Steps }) {
  return (
    <h1 className="kh-stencil">
      {Array.from(text).map((letter, index) => {
        const stamped = stepShare(steps.title, time, index) ** STAMP.power;
        return <span key={index} style={{ opacity: stamped, transform: `scale(${STAMP.scale - (STAMP.scale - 1) * stamped})` }}>{letter}</span>;
      })}
    </h1>
  );
}

function Briefing({ values, clock, steps, screen }: Parts) {
  const stage = useStage();
  const revealed = steps.progress.start + steps.progress.duration;
  const time = useClockValue(clock, now => Math.min(now, revealed));
  const { now, left, progress, ticker } = screen;
  const count = left > 0 ? values.countdownPrefix + shortClock(left) : values.countdownDone;
  return (
    <>
      <div className="kh-briefing stage-box" ref={stage}>
        <Head values={values} opacity={stepShare(steps.head, time, 0)} />
        <span className="kh-clock" style={{ opacity: stepShare(steps.head, time, 1) }}>{new Date(now).toLocaleTimeString(values.locale)}</span>
        {values.briefingMapOn && <BriefingMap time={time} steps={steps} label={values.briefingLabel} target={values.briefingTarget} grid={values.mapGrid} />}
        <Title text={values.startingTitle} time={time} steps={steps} />
        <RadioDisplay time={time} steps={steps} count={count} />
        {values.radioLinesOn && <RadioLines clock={clock} step={steps.radio} lines={values.startingLines} every={values.linesEvery} staticMs={values.radioStaticMs} />}
        <div className="kh-factions" style={{ opacity: stepShare(steps.factions, time) }}>
          {TEAM_SET.variants.map(team => <span key={team.id} style={{ background: teamColor(values, team.id) }}>{teamLabel(values, team.id)}</span>)}
        </div>
      </div>
      {ticker && <div className="kh-ticker"><span>{ticker}</span></div>}
      {values.progressStyle !== "aus" && (
        <div className="kh-warning-stripes"><i style={{ "--part": progress * stepShare(steps.progress, time) } as CSSProperties} /></div>
      )}
    </>
  );
}

export default function Starting() {
  const values = useKoth();
  const [clock] = useState<KothClock>(() => ({ time: 0 }));
  const steps = useMemo(() => startingSteps(values.buildSpeed), [values.buildSpeed]);
  useRunClock(clock);
  const screen = useScreen({ countdownSeconds: values.countdown, ticker: values.ticker, next: "" });
  return (
    <div className="kh-screen kh-starting">
      <World values={values} clock={clock} steps={steps} />
      <div className="kh-shade" />
      <Briefing values={values} clock={clock} steps={steps} screen={screen} />
    </div>
  );
}
