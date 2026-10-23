// Ending scene of the Dachdecker theme (DESIGN-DACHDECKER.md "Szenen"): the finished house with timber walls under the
// covered roof, an evening sky, windows and door that light up one after the other, smoke from the chimney and the
// topping-out wreath with waving ribbons; the camera starts at the wreath and rides back to the whole house (shifted to the
// right); the acceptance protocol with the numbers of the stream is an overlay of its own (scenes/Stats.tsx). Title,
// subtitle, the next stream and the title block; fireworks again and again. Still image: ?t=<seconds>.
// The next stream comes from the settings (useScreen).
import { memo, useMemo, useState } from "react";
import { useScreen } from "../../../core/screens/useScreen.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import { particleCount } from "../../../core/three/quality.ts";
import Stage3D from "../../../core/three/Stage3D.tsx";
import { fillTemplate } from "../../../core/template.ts";
import { chimneyTop, house } from "../house.ts";
import Headline from "../plan/Headline.tsx";
import TitleBlock from "../plan/TitleBlock.tsx";
import { useRevealTime } from "../plan/useRevealTime.ts";
import { BUILT, type BuildClock, buildSchedule, endingPose, reached, type Schedule } from "../schedule.ts";
import type { DachdeckerValues } from "../settings.ts";
import Blueprint from "../three/Blueprint.tsx";
import DuskSky from "../three/DuskSky.tsx";
import Fireworks from "../three/Fireworks.tsx";
import House from "../three/House.tsx";
import OrbitCamera from "../three/OrbitCamera.tsx";
import RoofFrame from "../three/RoofFrame.tsx";
import Smoke from "../three/Smoke.tsx";
import Tiles from "../three/Tiles.tsx";
import Wreath from "../three/Wreath.tsx";
import { FACE_ROWS, ridgeOf } from "../tiles.ts";
import { dachdeckerNames, useDachdecker } from "../useDachdecker.ts";
import { BOTH_FACES, endingLook, frameDims, orbitOf, tilesOf } from "../world.ts";

type Parts = { values: DachdeckerValues; clock: BuildClock; schedule: Schedule };

const World = memo(function World({ values, clock, schedule }: Parts) {
  const dims = useMemo(() => frameDims(values), [values]);
  const tiles = useMemo(() => tilesOf(values, FACE_ROWS, BOTH_FACES), [values]);
  const home = useMemo(() => house(dims, values.wallHeight), [dims, values.wallHeight]);
  const look = endingLook(values);
  const orbit = { ...orbitOf(values), intro: values.endingIntro };
  const roofTop = home.roofBase + values.rise;
  return (
    <Stage3D background={look.sky} fog={look.fog} bloom={look.bloom} level={values.quality} fov={look.fov}>
      <DuskSky top={look.sky} glow={values.dusk} />
      <Blueprint grid={values.grid} opacity={values.gridOpacity} mood="dusk" palette={values} />
      <group position={[0, home.roofBase, 0]}>
        <RoofFrame
          dims={dims} clock={BUILT} schedule={schedule}
          accent={values.accent} line={values.line} fill={values.muted} lineOpacity={values.lineOpacity} fillOpacity={values.fillOpacity}
        />
        <Tiles tiles={tiles} clock={BUILT} step={schedule.tiles} slate={values.slate} copper={values.copper} brick={values.brick} edge={values.muted} lit ridge={ridgeOf(dims)} />
      </group>
      <House
        house={home} clock={clock} schedule={schedule} lights={values.windowsOn}
        line={values.line} lineOpacity={values.lineOpacity} wall={values.houseWall} timber={values.houseTimber} stone={values.slate} pane={values.slateDark}
        glow={values.accent} chimney={values.slateDark}
      />
      {values.smokeOn && <Smoke base={chimneyTop(home)} count={values.smokeAmount} clock={clock} seed={values.seed} color={values.muted} />}
      {values.wreathOn && (
        <Wreath
          at={home.wreath} height={values.wreathPole} clock={clock} schedule={schedule} green={values.wreathGreen} pole={values.copper}
          ribbons={values.ribbonColors} wind={values.ribbonWind}
        />
      )}
      {values.fireworksOn && (
        <Fireworks
          clock={clock} seed={values.seed} start={schedule.fireworks.start} every={values.fireworksEvery}
          sparks={particleCount(values.fireworksSparks, values.quality)} colors={[values.accent, values.copper, values.line, values.brick]}
        />
      )}
      <OrbitCamera clock={clock} pose={time => endingPose(schedule, orbit, time, roofTop)} shift={values.endingShift} />
    </Stage3D>
  );
});

function Plan({ values, clock, schedule }: Parts) {
  const stage = useStage();
  const { now, next } = useScreen({ countdownSeconds: 0, countdownAt: "", ticker: "", next: values.endingNext });
  const time = useRevealTime(clock, schedule);
  const names = dachdeckerNames(values, now);
  return (
    <div className="dd-stage stage-box" ref={stage}>
      <Headline
        head={fillTemplate(values.endingHead, names)} title={fillTemplate(values.endingTitle, names)} subtitle={fillTemplate(values.endingSubtitle, names)}
        big={next} time={time} schedule={schedule} scramble={values.scramble} flicker={values.flicker}
      />
      {values.endingBlock && <TitleBlock lines={values.endingBlockLines.map(line => fillTemplate(line, names))} opacity={reached(schedule.block, time)} />}
    </div>
  );
}

export default function Ending() {
  const values = useDachdecker();
  const [clock] = useState<BuildClock>(() => ({ time: 0 }));
  const schedule = useMemo(
    () => buildSchedule({ buildSpeed: values.buildSpeed, scrambleMs: values.scrambleMs, countUpMs: values.countUpMs, windowStep: values.windowStep, stampAt: values.stampAt }, "ending"),
    [values.buildSpeed, values.scrambleMs, values.countUpMs, values.windowStep, values.stampAt],
  );
  return (
    <div className="dd-screen dd-ending">
      <World values={values} clock={clock} schedule={schedule} />
      <div className="dd-vignette" />
      <Plan values={values} clock={clock} schedule={schedule} />
    </div>
  );
}
