// Shapes of the backdrop of the Bärenbande theme in a 1920 x 1080 space (shapes only, the colors come from the settings):
// far hills and a city skyline with a suspension bridge in aerial perspective, a row of firs with a cave in a hill on
// the left, broad-leaved trees, a meadow with a path into the distance, grass tufts and flowers, clouds. Path builders
// for repeated things (firs, city blocks with windows, tufts, flowers) and their layout. Check: world.check.ts.

export const WORLD = { width: 1920, height: 1080, horizon: 720 };

// A fir with three soft tiers, its foot at (x, base), height and width in px
export function firPath(x: number, base: number, height: number, width: number): string {
  const tier = height / 3;
  const half = width / 2;
  const top = base - height;
  return [
    `M${x} ${top}`,
    `C${x + half * 0.3} ${top + tier * 0.6} ${x + half * 0.5} ${top + tier * 0.9} ${x + half * 0.62} ${top + tier}`,
    `L${x + half * 0.4} ${top + tier}`,
    `C${x + half * 0.6} ${top + tier * 1.6} ${x + half * 0.8} ${top + tier * 1.9} ${x + half * 0.86} ${top + tier * 2}`,
    `L${x + half * 0.6} ${top + tier * 2}`,
    `C${x + half * 0.8} ${top + tier * 2.5} ${x + half} ${base - 6} ${x + half} ${base}`,
    `L${x - half} ${base}`,
    `C${x - half} ${base - 6} ${x - half * 0.8} ${top + tier * 2.5} ${x - half * 0.6} ${top + tier * 2}`,
    `L${x - half * 0.86} ${top + tier * 2}`,
    `C${x - half * 0.8} ${top + tier * 1.9} ${x - half * 0.6} ${top + tier * 1.6} ${x - half * 0.4} ${top + tier}`,
    `L${x - half * 0.62} ${top + tier}`,
    `C${x - half * 0.5} ${top + tier * 0.9} ${x - half * 0.3} ${top + tier * 0.6} ${x} ${top} Z`,
  ].join(" ");
}

// The shaded right half of a fir (light from the left)
export function firShadePath(x: number, base: number, height: number, width: number): string {
  const half = width / 2;
  return `M${x} ${base - height} C${x + half * 0.5} ${base - height * 0.5} ${x + half} ${base - 6} ${x + half} ${base} L${x + half * 0.2} ${base} C${x + half * 0.3} ${base - height * 0.4} ${x + half * 0.2} ${base - height * 0.7} ${x} ${base - height} Z`;
}

// City blocks standing on base: [x, width, height]
export type Block = readonly [number, number, number];
export const blocksPath = (blocks: readonly Block[], base: number) =>
  blocks.map(([x, width, height]) => `M${x} ${base} L${x} ${base - height} L${x + width} ${base - height} L${x + width} ${base} Z`).join(" ");

// Windows of the blocks as a grid of small squares (rows from the top, a margin to the edges)
export function windowsPath(blocks: readonly Block[], base: number, size = 8, gap = 14): string {
  const cells: string[] = [];
  for (const [x, width, height] of blocks) {
    for (let top = base - height + gap; top + size < base - gap; top += gap + size) {
      for (let left = x + gap / 2; left + size < x + width - gap / 2; left += gap + size) {
        cells.push(`M${left} ${top} h${size} v${size} h${-size} Z`);
      }
    }
  }
  return cells.join(" ");
}

// A grass tuft of three blades at (x, base)
export const tuftPath = (x: number, base: number, size: number) =>
  `M${x - size} ${base} Q${x - size * 0.8} ${base - size * 1.2} ${x - size * 1.1} ${base - size * 1.8} Q${x - size * 0.3} ${base - size} ${x - size * 0.2} ${base} ` +
  `M${x - size * 0.3} ${base} Q${x} ${base - size * 1.6} ${x + size * 0.2} ${base - size * 2.2} Q${x + size * 0.4} ${base - size * 1.2} ${x + size * 0.3} ${base} ` +
  `M${x + size * 0.2} ${base} Q${x + size * 0.9} ${base - size} ${x + size * 1.3} ${base - size * 1.5} Q${x + size} ${base - size * 0.6} ${x + size} ${base} Z`;

// A small flower with four petals around (x, y)
export const flowerPath = (x: number, y: number, size: number) =>
  [[0, -1], [1, 0], [0, 1], [-1, 0]]
    .map(([dx, dy]) => {
      const cx = x + dx * size;
      const cy = y + dy * size;
      const petal = size * 0.7;
      return `M${cx - petal} ${cy} A${petal} ${petal} 0 1 0 ${cx + petal} ${cy} A${petal} ${petal} 0 1 0 ${cx - petal} ${cy} Z`;
    })
    .join(" ");

// Fixed shapes
export const SHAPES = {
  hills: "M0 640 C220 560 420 600 640 572 C880 540 1080 600 1320 560 C1560 522 1760 578 1920 548 L1920 760 L0 760 Z",
  meadow: "M0 762 C300 722 600 744 900 732 C1200 720 1500 752 1920 722 L1920 1080 L0 1080 Z",
  meadowPatches:
    "M120 900 C260 860 420 880 520 920 C420 960 220 960 120 900 Z M1300 980 C1460 940 1660 950 1780 990 C1640 1030 1420 1030 1300 980 Z M700 820 C820 800 940 810 1000 830 C900 850 780 850 700 820 Z",
  path: "M880 1080 C940 960 1080 900 1240 842 C1340 806 1440 784 1540 764 L1572 766 C1474 792 1384 822 1296 862 C1160 922 1056 984 1036 1080 Z",
  mound: "M-20 830 C40 650 180 560 330 566 C470 572 560 690 590 830 Z",
  cave: "M196 830 C196 734 246 690 300 690 C354 690 404 734 404 830 Z",
  caveRim: "M196 830 C196 734 246 690 300 690 C354 690 404 734 404 830",
  bridgeTowers:
    "M1478 470 L1494 470 L1496 690 L1476 690 Z M1756 470 L1772 470 L1774 690 L1754 690 Z M1474 520 L1498 520 L1498 530 L1474 530 Z M1752 520 L1776 520 L1776 530 L1752 530 Z",
  bridgeDeck: "M1360 640 L1920 628 L1920 642 L1360 654 Z",
  bridgeCables:
    "M1360 640 C1410 610 1450 540 1486 470 C1560 600 1690 600 1764 470 C1800 540 1860 600 1920 612 M1520 600 L1520 646 M1560 618 L1560 644 M1600 626 L1600 642 M1640 626 L1640 641 M1680 618 L1680 640 M1720 600 L1720 638",
  water: "M1180 700 C1400 690 1700 684 1920 680 L1920 740 L1180 740 Z",
  trunk: "M-8 0 C-10 -60 -6 -120 -4 -170 L6 -170 C8 -120 12 -60 10 0 Z",
  crown: "M-90 -170 C-110 -230 -60 -300 0 -296 C60 -310 120 -250 96 -186 C120 -140 70 -100 20 -120 C-20 -96 -100 -110 -90 -170 Z",
  crownShade: "M20 -296 C70 -296 120 -250 96 -186 C120 -140 70 -100 20 -120 C60 -150 70 -230 20 -296 Z",
  cloud: "M20 70 C0 70 0 40 24 38 C24 14 60 6 74 26 C84 2 128 2 136 30 C160 22 186 40 176 62 C190 70 180 80 168 80 L28 80 C22 80 18 76 20 70 Z",
  sun: "M-60 0 A60 60 0 1 0 60 0 A60 60 0 1 0 -60 0 Z",
  moon: "M-10 -46 A46 46 0 1 0 -10 46 A36 36 0 1 1 -10 -46 Z",
};

// Layout: firs [x, height, width] standing on FIR_BASE, city blocks, broad-leaved trees [x, base, scale], tufts and
// flowers [x, y, size]
export const FIRS: readonly (readonly [number, number, number])[] = [
  [40, 330, 150], [130, 400, 170], [230, 360, 160], [470, 380, 165], [560, 300, 140], [640, 250, 120],
];
export const FIR_BASE = 800;
export const CITY: readonly Block[] = [
  [1180, 60, 120], [1250, 44, 170], [1300, 70, 90], [1380, 38, 210], [1424, 56, 140], [1540, 48, 120], [1600, 66, 180],
  [1680, 40, 110], [1800, 58, 150], [1866, 54, 100],
];
export const CITY_BASE = 700;
export const TREES: readonly (readonly [number, number, number])[] = [[860, 760, 0.8], [1090, 748, 0.6]];
export const TUFTS: readonly (readonly [number, number, number])[] = [
  [90, 1000, 22], [330, 960, 18], [610, 1040, 24], [760, 900, 14], [1180, 1020, 22], [1460, 930, 16], [1700, 1050, 24], [1860, 960, 18],
];
export const FLOWERS: readonly (readonly [number, number, number])[] = [
  [160, 1040, 7], [190, 1028, 6], [420, 1000, 6], [1250, 1058, 7], [1600, 990, 6], [1630, 1004, 7], [1820, 1030, 6],
];
