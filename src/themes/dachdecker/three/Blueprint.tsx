// Ground and light of the 3D world of the Dachdecker theme (DESIGN-DACHDECKER.md "Grund"): a perspective grid of plan
// lines on the floor, main lines every 2 m and a fine grid every 0.2 m, a bluish half-sphere light and a moon from top
// left for the shine of the tiles. Background and fog come from Stage3D.
import { useEffect, useMemo } from "react";
import { GridHelper } from "three";

type Props = { grid: boolean; opacity: number; line: string; sky: string; ground: string };

const SIZE = 80;
const MAIN = 40;
const FINE = 400;
// The fine grid is this much fainter than the main grid
const FINE_SHARE = 0.27;
const SKY_LIGHT = 0.9;
const MOON_LIGHT = 1.1;
const MOON_AT = [-6, 10, 4] as const;

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

export default function Blueprint({ grid, opacity, line, sky, ground }: Props) {
  const main = useGrid(MAIN, line, opacity);
  const fine = useGrid(FINE, line, opacity * FINE_SHARE);
  return (
    <>
      {grid && <primitive object={main} />}
      {grid && <primitive object={fine} />}
      <hemisphereLight args={[sky, ground, SKY_LIGHT]} />
      <directionalLight position={MOON_AT} intensity={MOON_LIGHT} color={line} />
    </>
  );
}
