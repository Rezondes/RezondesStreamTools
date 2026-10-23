// Scenery of the Kebab skin behind the dashboard (DESIGN-KEBAB.md "Dashboard-Skin"): the chef at the spit bottom right
// and the arc title top left, as still red lines with the default values. Loaded lazily by the dashboard, because the
// lines come from Rough.js and must not load in its entry chunk.
import { VIEW } from "./chef.ts";
import ArcTitle from "./ink/ArcTitle.tsx";
import Chef from "./ink/Chef.tsx";
import type { KebabValues } from "./settings.ts";

// fixed: the part of the grid that holds the arc title alone
const ARC_VIEW = "40 70 520 200";
// The chef stands still: no time passes and his life never starts
const still = () => 0;
const noop = () => {};

export default function SkinScenery({ values }: { values: KebabValues }) {
  return (
    <>
      <svg className="skin-chef" viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.width} ${VIEW.height}`}>
        <Chef values={values} clock={still} idleFrom={Infinity} pose="saw" />
      </svg>
      <svg className="skin-arc" viewBox={ARC_VIEW}>
        <ArcTitle text={values.arcText} size={values.arcSize} span={values.arcSpan} stroke={values.arcStroke} onReady={noop} />
      </svg>
    </>
  );
}
