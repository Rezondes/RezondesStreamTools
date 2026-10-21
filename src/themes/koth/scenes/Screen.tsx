// Full-screen scenes of the KOTH theme (PLAN-KOTH.md packages 2 and 3, DESIGN-KOTH.md "Modernisierung"): the hill as a
// 3D world with radio mast, flag, camp and smoke. Starting: the hill builds itself in the evening while the camera pulls
// back and circles. BRB: the built hill at night with moon, searchlight and camp fire, the camera circles lower. Ending:
// dusk, the flag goes up again, flares in the faction colors, the mission report counts the real numbers up to the stamp.
// On top the briefing: head line, clock, briefing map (Starting, BRB) or report (Ending), stencil title stamped letter by
// letter, the radio display with countdown, break time or next mission, radio lines, factions, warning stripes as
// progress. One clock drives everything: the GSAP timeline runs it, the 3D parts read it every frame, the briefing
// follows it until it is revealed. Still image: ?t=<seconds>. Parameters per source: ?min=5, ?at=20:00, ?next=...,
// ?ticker=...
import { type CSSProperties, useMemo, useState } from "react";
import { useStreamStats } from "../../../core/hooks/useStreamStats.ts";
import { type ScreenKind, shortClock } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import { countedStats, parseStatLines } from "../../../core/stats/stats.ts";
import { fillTemplate } from "../../../core/template.ts";
import BriefingMap from "../briefing/BriefingMap.tsx";
import RadioDisplay from "../briefing/RadioDisplay.tsx";
import RadioLines from "../briefing/RadioLines.tsx";
import Report from "../briefing/Report.tsx";
import { type KothClock, screenSteps, type Steps, stepShare } from "../build.ts";
import { worldLook } from "../looks.ts";
import { TEAM_SET, type KothValues } from "../settings.ts";
import World from "../three/World.tsx";
import { useClockValue, useRunClock } from "../useClock.ts";
import { kothNames, teamColor, teamLabel, useKoth } from "../useKoth.ts";

type Screen = ReturnType<typeof useScreen>;
type Parts = { kind: ScreenKind; values: KothValues; clock: KothClock; steps: Steps; screen: Screen };

// fixed: the stamp of a title letter (scale at the start, curve power4.in)
const STAMP = { scale: 1.8, power: 4 };
const CHANNEL = "{channel}";

const texts = (values: KothValues, kind: ScreenKind) => ({
  starting: { eyebrow: values.startingEyebrow, title: values.startingTitle, lines: values.startingLines },
  brb: { eyebrow: values.brbEyebrow, title: values.brbTitle, lines: values.brbLines },
  ending: { eyebrow: values.endingEyebrow, title: values.endingTitle, lines: values.endingLines },
}[kind]);

// Head line: the call of the alerts with the channel name in the signal color, then the overline of the screen
function Head({ values, eyebrow, opacity }: { values: KothValues; eyebrow: string; opacity: number }) {
  const [before, ...after] = values.alertCallsign.split(CHANNEL);
  const names = kothNames(values);
  return (
    <p className="kh-head" style={{ opacity }}>
      {fillTemplate(before, names)}
      {after.length > 0 && <b>{values.channelName}</b>}
      {fillTemplate(after.join(CHANNEL), names)} // {eyebrow}
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

// The report of the Ending with the real numbers of the stream (only this screen listens to the stats)
function EndingReport({ values, time, steps, now }: { values: KothValues; time: number; steps: Steps; now: number }) {
  const stats = useStreamStats();
  const lines = useMemo(() => parseStatLines(values.reportLines.join("\n")), [values.reportLines]);
  const rows = countedStats(stats, lines, values.locale, now, lines.map((_, index) => stepShare(steps.rows, time, index)));
  return <Report time={time} steps={steps} title={values.reportTitle} rows={rows} stamp={values.stampText} />;
}

// What the radio display shows: the countdown, the break time or the next mission (nothing without one)
function displayText(kind: ScreenKind, values: KothValues, screen: Screen) {
  if (kind === "brb") return values.afkPrefix + shortClock(screen.away);
  if (kind === "ending") return screen.next ? `${values.endingNextLabel}: ${screen.next}` : "";
  return screen.left > 0 ? values.countdownPrefix + shortClock(screen.left) : values.countdownDone;
}

function Briefing({ kind, values, clock, steps, screen }: Parts) {
  const stage = useStage();
  const revealed = Math.max(steps.progress.start + steps.progress.duration, kind === "ending" ? steps.stamp.start + steps.stamp.duration : 0);
  const time = useClockValue(clock, now => Math.min(now, revealed));
  const { eyebrow, title, lines } = texts(values, kind);
  const display = displayText(kind, values, screen);
  return (
    <>
      <div className="kh-briefing stage-box" ref={stage}>
        <Head values={values} eyebrow={eyebrow} opacity={stepShare(steps.head, time, 0)} />
        <span className="kh-clock" style={{ opacity: stepShare(steps.head, time, 1) }}>{new Date(screen.now).toLocaleTimeString(values.locale)}</span>
        {kind !== "ending" && values.briefingMapOn && <BriefingMap time={time} steps={steps} label={values.briefingLabel} target={values.briefingTarget} grid={values.mapGrid} />}
        {kind === "ending" && values.reportOn && <EndingReport values={values} time={time} steps={steps} now={screen.now} />}
        <Title text={title} time={time} steps={steps} />
        {display && <RadioDisplay time={time} steps={steps} count={display} />}
        {values.radioLinesOn && <RadioLines clock={clock} step={steps.radio} lines={lines} every={values.linesEvery} staticMs={values.radioStaticMs} />}
        <div className="kh-factions" style={{ opacity: stepShare(steps.factions, time) }}>
          {TEAM_SET.variants.map(team => <span key={team.id} style={{ background: teamColor(values, team.id) }}>{teamLabel(values, team.id)}</span>)}
        </div>
      </div>
      {screen.ticker && <div className="kh-ticker"><span>{screen.ticker}</span></div>}
      {kind === "starting" && values.progressStyle !== "aus" && (
        <div className="kh-warning-stripes"><i style={{ "--part": screen.progress * stepShare(steps.progress, time) } as CSSProperties} /></div>
      )}
    </>
  );
}

export default function Screen({ kind }: { kind: ScreenKind }) {
  const values = useKoth();
  const [clock] = useState<KothClock>(() => ({ time: 0 }));
  const steps = useMemo(
    () => screenSteps(kind, values.buildSpeed, { stampAt: values.stampAt, countUpMs: values.countUpMs }),
    [kind, values.buildSpeed, values.stampAt, values.countUpMs],
  );
  const look = useMemo(() => worldLook(values, kind), [values, kind]);
  useRunClock(clock);
  const screen = useScreen({ countdownSeconds: values.countdown, ticker: values.ticker, next: values.endingNext });
  return (
    <div className={`kh-screen kh-screen-3d kh-${kind}`}>
      <World kind={kind} values={values} clock={clock} steps={steps} look={look} />
      <div className="kh-shade" />
      <Briefing kind={kind} values={values} clock={clock} steps={steps} screen={screen} />
    </div>
  );
}
