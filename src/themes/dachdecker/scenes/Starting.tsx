// Starting scene of the Dachdecker theme (DESIGN-DACHDECKER.md "Szenen"): on blueprint the roof frame builds itself in
// 3D (wall plates, front truss in terracotta, the other trusses, purlins, battens, the first rows of tiles) while the
// camera rides out and circles. On the plan layer the head line, the decoding title and countdown, the dimension chain as
// progress, changing lines, the title block and the ticker. One clock drives everything: the GSAP timeline runs it, the
// 3D parts read it every frame, the texts follow it until they are revealed. Still image: ?t=<seconds>.
// Parameters per source: ?min=5, ?at=20:00, ?ticker=...
import { memo, useMemo, useState } from "react";
import { rotating, shortClock } from "../../../core/screens/screens.ts";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import Stage3D from "../../../core/three/Stage3D.tsx";
import { fillTemplate } from "../../../core/template.ts";
import Headline from "../plan/Headline.tsx";
import Progress from "../plan/Progress.tsx";
import TitleBlock from "../plan/TitleBlock.tsx";
import { useRevealTime } from "../plan/useRevealTime.ts";
import { type BuildClock, buildSchedule, cameraPose, reached, type Schedule } from "../schedule.ts";
import type { DachdeckerValues } from "../settings.ts";
import Blueprint from "../three/Blueprint.tsx";
import OrbitCamera from "../three/OrbitCamera.tsx";
import RoofFrame from "../three/RoofFrame.tsx";
import Tiles from "../three/Tiles.tsx";
import { dachdeckerNames, useDachdecker } from "../useDachdecker.ts";
import { frameDims, ONE_FACE, orbitOf, stageLook, tilesOf } from "../world.ts";

// fixed: seconds in ms for the rhythm of the lines
const SECOND_MS = 1000;

type Parts = { values: DachdeckerValues; clock: BuildClock; schedule: Schedule };

// The 3D world, memoized so the texts can render often without touching the canvas
const World = memo(function World({ values, clock, schedule }: Parts) {
  const dims = useMemo(() => frameDims(values), [values]);
  const tiles = useMemo(() => (values.startingTiles ? tilesOf(values, values.startingTileRows, ONE_FACE) : []), [values]);
  const look = stageLook(values);
  const orbit = orbitOf(values);
  return (
    <Stage3D background={look.sky} fog={look.fog} bloom={look.bloom} level={values.quality} fov={look.fov}>
      <Blueprint grid={values.grid} opacity={values.gridOpacity} mood="plan" palette={values} />
      <RoofFrame
        dims={dims} clock={clock} schedule={schedule}
        accent={values.accent} line={values.line} fill={values.muted} lineOpacity={values.lineOpacity} fillOpacity={values.fillOpacity}
      />
      {tiles.length > 0 && (
        <Tiles tiles={tiles} clock={clock} step={schedule.tiles} slate={values.slate} copper={values.copper} brick={values.brick} edge={values.muted} lit={false} />
      )}
      <OrbitCamera clock={clock} pose={time => cameraPose(schedule, orbit, time)} />
    </Stage3D>
  );
});

// The plan layer: texts follow the clock until they are revealed, then only the countdown changes
function Plan({ values, clock, schedule }: Parts) {
  const stage = useStage();
  const { now, start, left, progress, ticker } = useScreen({ countdownSeconds: values.countdown, ticker: values.ticker, next: "" });
  const time = useRevealTime(clock, schedule);
  const names = dachdeckerNames(values, now);
  const saying = rotating(values.startingLines, values.linesEvery * SECOND_MS, now - start);
  return (
    <>
      <div className="dd-stage stage-box" ref={stage}>
        <Headline
          head={fillTemplate(values.startingHead, names)} title={fillTemplate(values.startingTitle, names)}
          subtitle={fillTemplate(values.startingSubtitle, names)} big={left > 0 ? values.countdownPrefix + shortClock(left) : values.countdownDone}
          time={time} schedule={schedule} scramble={values.scramble} flicker={values.flicker}
        />
        {saying && <p key={saying} className="dd-saying" style={{ opacity: reached(schedule.head, time) }}>{saying}</p>}
        {values.startingProgress !== "aus" && (
          <div className="dd-progress-box" style={{ opacity: reached(schedule.count, time) }}><Progress share={progress} /></div>
        )}
        {values.startingBlock && <TitleBlock lines={values.startingBlockLines.map(line => fillTemplate(line, names))} opacity={reached(schedule.block, time)} />}
      </div>
      {ticker && <div className="dd-ticker"><span>{ticker}</span></div>}
    </>
  );
}

export default function Starting() {
  const values = useDachdecker();
  const [clock] = useState<BuildClock>(() => ({ time: 0 }));
  const schedule = useMemo(() => buildSchedule({ buildSpeed: values.buildSpeed, scrambleMs: values.scrambleMs }), [values.buildSpeed, values.scrambleMs]);
  return (
    <div className="dd-screen dd-starting">
      <World values={values} clock={clock} schedule={schedule} />
      <div className="dd-vignette" />
      <Plan values={values} clock={clock} schedule={schedule} />
    </div>
  );
}
