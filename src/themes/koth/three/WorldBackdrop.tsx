// The hill of the screens as a backdrop (commands page, dashboard skin): the 3D world of a scene with its build and its
// light (morning the Starting, night the BRB, evening the Ending), without the briefing.
import { useMemo, useState } from "react";
import type { ScreenKind } from "../../../core/screens/screens.ts";
import { type KothClock, screenSteps } from "../build.ts";
import { worldLook } from "../looks.ts";
import type { KothValues } from "../settings.ts";
import { useRunClock } from "../useClock.ts";
import World from "./World.tsx";

// The scene that shows a time of day: morning and noon the Starting, evening the Ending, night the BRB
export const kindOfTime = (time: string): ScreenKind => ({ abend: "ending", nacht: "brb" } as Record<string, ScreenKind>)[time] ?? "starting";

export default function WorldBackdrop({ values, kind }: { values: KothValues; kind: ScreenKind }) {
  const [clock] = useState<KothClock>(() => ({ time: 0 }));
  const steps = useMemo(() => screenSteps(kind, values.buildSpeed, { stampAt: values.stampAt, countUpMs: values.countUpMs }), [kind, values.buildSpeed, values.stampAt, values.countUpMs]);
  const look = useMemo(() => worldLook(values, kind), [values, kind]);
  useRunClock(clock);
  return <World kind={kind} values={values} clock={clock} steps={steps} look={look} />;
}
