// Ground and light of the 3D world of the Dachdecker theme (DESIGN-DACHDECKER.md "Grund"): a perspective grid of plan
// lines on the floor, main lines every 2 m and a fine grid every 0.2 m, and the light of the scene: a bluish half-sphere
// light with a moon from top left (plan, rain) or an evening sun low behind the house and a cool fill light (dusk).
// Background and fog come from Stage3D. Light colors are mixed from the colors of the settings.
import { useEffect, useMemo } from "react";
import { Color, GridHelper } from "three";

type Mood = "plan" | "rain" | "dusk";
// The colors and the light of the settings (the scenes pass their values)
export type Palette = {
  line: string; muted: string; blueprint: string; page: string; accent: string; dusk: string; gridFineShare: number; rainGround: number; duskGround: number;
  moonWhite: number; sunWhite: number; lightPlanSky: number; lightPlanMain: number; lightRainSky: number; lightRainMain: number; lightDuskSky: number;
  lightDuskMain: number; lightDuskFill: number;
};
type Props = { grid: boolean; opacity: number; mood: Mood; palette: Palette };

const SIZE = 80;
const MAIN = 40;
const FINE = 400;
// Per mood: the place of the main light and of the fill light; their strengths come from the settings
const PLACES = {
  plan: { mainAt: [-6, 10, 4], fillAt: [0, 0, 0] },
  rain: { mainAt: [-6, 10, 6], fillAt: [0, 0, 0] },
  dusk: { mainAt: [10, 4, -12], fillAt: [-8, 10, 10] },
} as const;

// Per mood: half-sphere light, the main light, the fill light (0 = none)
function lightsOf(mood: Mood, palette: Palette) {
  if (mood === "rain") return { sky: palette.lightRainSky, main: palette.lightRainMain, fill: 0 };
  if (mood === "dusk") return { sky: palette.lightDuskSky, main: palette.lightDuskMain, fill: palette.lightDuskFill };
  return { sky: palette.lightPlanSky, main: palette.lightPlanMain, fill: 0 };
}

function useGrid(divisions: number, color: string, opacity: number) {
  const grid = useMemo(() => {
    const helper = new GridHelper(SIZE, divisions, color, color);
    helper.material.transparent = true;
    helper.material.opacity = opacity;
    helper.material.depthWrite = false;
    return helper;
  }, [divisions, color, opacity]);
  useEffect(() => () => { grid.geometry.dispose(); grid.material.dispose(); }, [grid]);
  return grid;
}

function lightColors(mood: Mood, palette: Palette) {
  const color = (value: string) => new Color(value);
  if (mood === "rain") return { ground: color(palette.page).multiplyScalar(palette.rainGround), main: color(palette.muted).lerp(color(palette.line), palette.moonWhite) };
  if (mood === "dusk") return { ground: color(palette.dusk).multiplyScalar(palette.duskGround), main: color(palette.accent).lerp(color(palette.line), palette.sunWhite) };
  return { ground: color(palette.blueprint), main: color(palette.line) };
}

export default function Blueprint({ grid, opacity, mood, palette }: Props) {
  const main = useGrid(MAIN, palette.line, opacity);
  const fine = useGrid(FINE, palette.line, opacity * palette.gridFineShare);
  const light = { ...lightsOf(mood, palette), ...PLACES[mood] };
  const colors = useMemo(() => lightColors(mood, palette), [mood, palette]);
  return (
    <>
      {grid && <primitive object={main} />}
      {grid && <primitive object={fine} />}
      <hemisphereLight args={[palette.muted, colors.ground, light.sky]} />
      <directionalLight position={light.mainAt} intensity={light.main} color={colors.main} />
      {light.fill > 0 && <directionalLight position={light.fillAt} intensity={light.fill} color={palette.muted} />}
    </>
  );
}
