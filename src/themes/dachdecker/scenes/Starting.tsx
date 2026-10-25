// Starting scene of the Dachdecker theme (DESIGN-DACHDECKER.md "Szenen"): on blueprint the roof frame builds itself in
// 3D (wall plates, front truss in terracotta, the other trusses, purlins, battens, the first rows of tiles) while the
// camera rides out and circles; the other tiles follow over the countdown, so the roof is covered with its ridge at 0. On the plan layer the head line, the decoding title and countdown, the dimension chain as
// progress, changing lines, the title block and the ticker. One clock drives everything: the GSAP timeline runs it, the
// 3D parts read it every frame, the texts follow it until they are revealed. Still image: ?t=<seconds>.
// Countdown and ticker come from the settings (useScreen).
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
import { type BuildClock, buildSchedule, cameraPose, coverEnd, coverLanding, reached, type Schedule } from "../schedule.ts";
import type { DachdeckerValues } from "../settings.ts";
import Blueprint from "../three/Blueprint.tsx";
import OrbitCamera from "../three/OrbitCamera.tsx";
import RoofFrame, { frameLookOf } from "../three/RoofFrame.tsx";
import Tiles, { tileLookOf } from "../three/Tiles.tsx";
import { dachdeckerNames, useDachdecker } from "../useDachdecker.ts";
import { FACE_ROWS, ridgeOf, type Tile } from "../tiles.ts";
import { BOTH_FACES, frameDims, orbitOf, stageLook, tilesOf } from "../world.ts";

// fixed: seconds in ms for the rhythm of the lines
const SECOND_MS = 1000;

type Parts = { values: DachdeckerValues; clock: BuildClock; schedule: Schedule };
type Screen = ReturnType<typeof useScreen>;

// The whole roof: first the rows of the build on the front face, then the rest row by row, both faces in turn
function coverOrder(tiles: readonly Tile[], firstRows: number) {
  const first = tiles.filter(tile => tile.side === 1 && tile.row < firstRows);
  const rest = tiles.filter(tile => !first.includes(tile)).sort((one, two) => one.row - two.row || two.side - one.side);
  return { tiles: [...first, ...rest], first: first.length };
}

// The 3D world, memoized so the texts can render often without touching the canvas
const World = memo(function World({ values, clock, schedule, until }: Parts & { until: number }) {
  const dims = useMemo(() => frameDims(values), [values]);
  const cover = useMemo(() => coverOrder(values.startingTiles ? tilesOf(values, FACE_ROWS, BOTH_FACES) : [], values.startingTileRows), [values]);
  const { tiles, first } = cover;
  const land = useMemo(() => (index: number, time: number) => coverLanding(schedule.tiles, index, time, first, tiles.length, until), [schedule, first, tiles, until]);
  const look = stageLook(values);
  const orbit = orbitOf(values);
  return (
    <Stage3D background={look.sky} fog={look.fog} bloom={look.bloom} level={values.quality} fov={look.fov}>
      <Blueprint grid={values.grid} opacity={values.gridOpacity} mood="plan" palette={values} />
      <RoofFrame
        dims={dims} clock={clock} schedule={schedule}
        accent={values.accent} line={values.line} fill={values.muted} lineOpacity={values.lineOpacity} fillOpacity={values.fillOpacity} {...frameLookOf(values)}
      />
      {tiles.length > 0 && (
        <Tiles
          tiles={tiles} clock={clock} step={schedule.tiles} land={land} doneAt={coverEnd(schedule.tiles, first, tiles.length, until)} ridge={ridgeOf(dims)}
          slate={values.slate} copper={values.copper} brick={values.brick} edge={values.muted} {...tileLookOf(values)} lit={false}
        />
      )}
      <OrbitCamera clock={clock} pose={time => cameraPose(schedule, orbit, time)} />
    </Stage3D>
  );
});

// The plan layer: texts follow the clock until they are revealed, then only the countdown changes
function Plan({ values, clock, schedule, screen }: Parts & { screen: Screen }) {
  const stage = useStage();
  const { now, start, left, progress, ticker } = screen;
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
  const screen = useScreen({ countdownSeconds: values.countdown, countdownAt: values.countdownAt, ticker: values.ticker, next: "" });
  return (
    <div className="dd-screen dd-starting">
      <World values={values} clock={clock} schedule={schedule} until={screen.total} />
      <div className="dd-vignette" />
      <Plan values={values} clock={clock} schedule={schedule} screen={screen} />
    </div>
  );
}
