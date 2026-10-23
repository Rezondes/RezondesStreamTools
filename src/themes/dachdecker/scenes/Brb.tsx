// BRB scene of the Dachdecker theme (DESIGN-DACHDECKER.md "Szenen"): the finished roof frame, both faces covered with
// slate and copper and a copper ridge, stands in the rain under a darker sky; drops bounce off the roof into splashes,
// the wind blows in gusts, lightning flashes far behind the house, the camera circles a little lower. On the plan layer
// head line, decoding title, subtitle in copper, the break time in terracotta, changing lines and the title block; an
// optional rain noise. Still image: ?t=<seconds>.
import { memo, useEffect, useMemo, useState } from "react";
import { rotating, shortClock } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import { particleCount } from "../../../core/three/quality.ts";
import Stage3D from "../../../core/three/Stage3D.tsx";
import { fillTemplate } from "../../../core/template.ts";
import Headline from "../plan/Headline.tsx";
import TitleBlock from "../plan/TitleBlock.tsx";
import { useRevealTime } from "../plan/useRevealTime.ts";
import { roofOf } from "../rain.ts";
import { BRB_VIEW, BUILT, type BuildClock, buildSchedule, cameraPose, reached, type Schedule } from "../schedule.ts";
import type { DachdeckerValues } from "../settings.ts";
import Blueprint from "../three/Blueprint.tsx";
import Lightning from "../three/Lightning.tsx";
import OrbitCamera from "../three/OrbitCamera.tsx";
import Rain from "../three/Rain.tsx";
import RoofFrame from "../three/RoofFrame.tsx";
import Tiles from "../three/Tiles.tsx";
import { ridgeOf } from "../tiles.ts";
import { startRain } from "../tones.ts";
import { dachdeckerNames, useDachdecker } from "../useDachdecker.ts";
import { BOTH_FACES, brbLook, frameDims, orbitOf, shareOf, splashColor, tilesOf } from "../world.ts";

// fixed: seconds in ms for the rhythm of the lines
const SECOND_MS = 1000;

type Parts = { values: DachdeckerValues; clock: BuildClock; schedule: Schedule };

const World = memo(function World({ values, clock, schedule }: Parts) {
  const dims = useMemo(() => frameDims(values), [values]);
  const tiles = useMemo(() => tilesOf(values, values.brbTileRows, BOTH_FACES), [values]);
  const roof = useMemo(() => roofOf(dims), [dims]);
  const look = brbLook(values);
  const orbit = { ...orbitOf(values), intro: false };
  return (
    <Stage3D background={look.sky} fog={look.fog} bloom={look.bloom} level={values.quality} fov={look.fov}>
      <Blueprint grid={values.grid} opacity={values.gridOpacity} mood="rain" palette={values} />
      <RoofFrame
        dims={dims} clock={BUILT} schedule={schedule}
        accent={values.accent} line={values.line} fill={values.muted} lineOpacity={values.lineOpacity} fillOpacity={values.fillOpacity}
      />
      <Tiles tiles={tiles} clock={BUILT} step={schedule.tiles} slate={values.slate} copper={values.copper} brick={values.brick} edge={values.muted} lit ridge={ridgeOf(dims)} />
      {values.rainOn && (
        <Rain
          clock={clock} roof={roof} count={particleCount(values.rainCount, values.quality)} speed={values.rainSpeed} length={values.rainLength}
          opacity={values.rainOpacity} color={values.rain} splashColor={splashColor(values)} splashes={values.splashOn} splashAmount={values.splashAmount}
          ground={values.splashGround} windMax={values.windMax} windEvery={values.windEvery} seed={values.seed}
        />
      )}
      {values.lightningOn && <Lightning clock={clock} every={values.lightningEvery} strength={values.lightningStrength} seed={values.seed} line={values.line} sky={look.sky} />}
      <OrbitCamera clock={clock} pose={time => cameraPose(schedule, orbit, time, BRB_VIEW)} />
    </Stage3D>
  );
});

function Plan({ values, clock, schedule }: Parts) {
  const stage = useStage();
  const { now, start, away, showAway } = useScreen({ countdownSeconds: 0, countdownAt: "", ticker: "", next: "" });
  const time = useRevealTime(clock, schedule);
  const names = dachdeckerNames(values, now);
  const saying = rotating(values.brbLines, values.linesEvery * SECOND_MS, now - start);
  return (
    <div className="dd-stage stage-box" ref={stage}>
      <Headline
        head={fillTemplate(values.brbHead, names)} title={fillTemplate(values.brbTitle, names)} subtitle={fillTemplate(values.brbSubtitle, names)}
        big={showAway ? values.brbTimerPrefix + shortClock(away) : ""} time={time} schedule={schedule} scramble={values.scramble} flicker={values.flicker}
      />
      {saying && <p key={saying} className="dd-saying" style={{ opacity: reached(schedule.head, time) }}>{saying}</p>}
      {values.brbBlock && <TitleBlock lines={values.brbBlockLines.map(line => fillTemplate(line, names))} opacity={reached(schedule.block, time)} />}
    </div>
  );
}

export default function Brb() {
  const values = useDachdecker();
  const [clock] = useState<BuildClock>(() => ({ time: 0 }));
  const schedule = useMemo(() => buildSchedule({ buildSpeed: values.buildSpeed, scrambleMs: values.scrambleMs }, "brb"), [values.buildSpeed, values.scrambleMs]);
  useEffect(() => (values.rainSound ? startRain(shareOf(values.rainVolume)) : undefined), [values.rainSound, values.rainVolume]);
  return (
    <div className="dd-screen dd-brb">
      <World values={values} clock={clock} schedule={schedule} />
      <div className="dd-vignette" />
      <Plan values={values} clock={clock} schedule={schedule} />
    </div>
  );
}
