// Full-screen scenes of the standard theme (Starting, BRB, Ending): all three show the light fields with GSAP motion
// (screen/LightScreen.tsx). Stage, countdown, break time and parameters come from the screens context of the core
// (src/core/screens). Countdown, ticker and next stream come from the settings (useScreen).
import type { ScreenKind } from "../../../core/screens/screens.ts";
import LightScreen from "../screen/LightScreen.tsx";

export default function Screen({ kind }: { kind: ScreenKind }) {
  return <LightScreen kind={kind} />;
}
