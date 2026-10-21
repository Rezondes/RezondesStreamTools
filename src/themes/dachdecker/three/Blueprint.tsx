// Ground and light of the 3D world of the Dachdecker theme (DESIGN-DACHDECKER.md "Grund"): a perspective grid of plan
// lines on the floor, main lines every 2 m and a fine grid every 0.2 m, and the light of the scene: a bluish half-sphere
// light with a moon from top left (plan, rain) or an evening sun low behind the house and a cool fill light (dusk).
// Background and fog come from Stage3D. Light colors are mixed from the colors of the settings.
import { useEffect, useMemo } from "react";
import { Color, GridHelper } from "three";

export type Mood = "plan" | "rain" | "dusk";
export type Palette = { line: string; muted: string; blueprint: string; page: string; accent: string; dusk: string };
type Props = { grid: boolean; opacity: number; mood: Mood; palette: Palette };

const SIZE = 80;
const MAIN = 40;
const FINE = 400;
// The fine grid is this much fainter than the main grid
const FINE_SHARE = 0.27;
// Per mood: half-sphere light, the main light and its place, an optional fill light
const LIGHTS = {
  plan: { sky: 0.9, main: 1.1, mainAt: [-6, 10, 4], fill: 0, fillAt: [0, 0, 0] },
  rain: { sky: 1.1, main: 1.4, mainAt: [-6, 10, 6], fill: 0, fillAt: [0, 0, 0] },
  dusk: { sky: 1.1, main: 1.6, mainAt: [10, 4, -12], fill: 0.8, fillAt: [-8, 10, 10] },
} as const;
// Shares of the mixed light colors
const RAIN_GROUND = 0.6;
const DUSK_GROUND = 0.3;
const MOON_WHITE = 0.5;
const SUN_WHITE = 0.45;

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
  if (mood === "rain") return { ground: color(palette.page).multiplyScalar(RAIN_GROUND), main: color(palette.muted).lerp(color(palette.line), MOON_WHITE) };
  if (mood === "dusk") return { ground: color(palette.dusk).multiplyScalar(DUSK_GROUND), main: color(palette.accent).lerp(color(palette.line), SUN_WHITE) };
  return { ground: color(palette.blueprint), main: color(palette.line) };
}

export default function Blueprint({ grid, opacity, mood, palette }: Props) {
  const main = useGrid(MAIN, palette.line, opacity);
  const fine = useGrid(FINE, palette.line, opacity * FINE_SHARE);
  const light = LIGHTS[mood];
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
