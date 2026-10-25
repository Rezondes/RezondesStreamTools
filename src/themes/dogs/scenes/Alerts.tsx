// Alerts of the Dogs theme (DESIGN-DOGS.md "Alerts", prototype refs/px-alert.html), transparent on the stage: the
// streamer's dog runs in with the toy of the kind, drops it, barks, the card comes up above the running track, then it
// picks the toy up and runs out; with a raid one dog per raider runs behind it (AlertWorld). The queue waits as long as
// the plan of each alert (alertLengthMs). An own file for the kind plays once instead of the built-in sounds, the own
// leave file on fading out. ?t=<seconds> shows a still, ?sound=0 keeps it silent.
import type { Application } from "pixi.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ALERT_SOUND_KEYS } from "../../../core/alerts/alerts.ts";
import { useAlertSounds } from "../../../core/alerts/useAlertSounds.ts";
import { useAlerts } from "../../../core/hooks/useAlerts.ts";
import PixiStage from "../../../core/pixi/PixiStage.tsx";
import { STAGE } from "../../../core/screens/screens.ts";
import { useStage } from "../../../core/screens/useStage.ts";
import { playSound } from "../../../core/sound.ts";
import type { Alert } from "../../../core/types.ts";
import { alertScaleOf } from "../alert.ts";
import { alertLengthMs, planAlert } from "../alertPlan.ts";
import { BREED_IDS, isBreed } from "../breeds.ts";
import { dogCache } from "../dog.ts";
import { dogLookOf } from "../looks.ts";
import AlertWorld from "../pixi/AlertWorld.tsx";
import AlertCard from "../screen/AlertCard.tsx";
import { preloadDogSounds } from "../tones.ts";
import { useDogs } from "../useDogs.ts";
import { sceneClock } from "../useFrame.ts";

export default function Alerts() {
  const values = useDogs();
  const { current, leaving } = useAlerts(alert => alertLengthMs(alert, values));
  useEffect(() => preloadDogSounds(["alertRun", "toyBall", "toyKnochen", "toyFrisbee", "toyLeckerli", "bark", "alertCard", "alertLeave", "alertRaid"]), []);
  return <div className="dg-screen">{current && <DogAlert key={current.key} alert={current} leaving={leaving} />}</div>;
}

function DogAlert({ alert, leaving }: { alert: Alert; leaving: boolean }) {
  const values = useDogs();
  const [clock] = useState(sceneClock);
  const [app, setApp] = useState<Application | null>(null);
  const [plan] = useState(() => planAlert(alert, values));
  const own = values[ALERT_SOUND_KEYS[alert.kind]];
  const leave = values.soundLeave;
  useAlertSounds(own.file ? () => playSound(own, () => undefined) : null, leave.file ? () => playSound(leave, () => undefined) : null, leaving);
  const breed = isBreed(values.dog) ? values.dog : BREED_IDS[0];
  const dog = useMemo(() => dogCache(dogLookOf(values, breed, values.coat)), [values, breed]);
  const width = Math.ceil(STAGE.width / alertScaleOf(values.pixelScale, values.alertSize).pixel);
  const stage = useStage();
  const onReady = useCallback((ready: Application) => {
    setApp(ready);
    return () => setApp(null);
  }, []);
  return (
    <>
      <PixiStage background={null} onReady={onReady} className="dg-world" />
      {app && <AlertWorld app={app} clock={clock} values={values} breed={breed} dog={dog} toy={plan.toy} schedule={plan.schedule} pack={plan.pack} builtIn={!own.file} width={width} />}
      <div className="dg-stage stage-box" ref={stage}>
        <AlertCard values={values} clock={clock} schedule={plan.schedule} dog={dog} tag={plan.tag} user={alert.user} line={plan.line} />
      </div>
    </>
  );
}
