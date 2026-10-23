// Shapes of the King of the Hill backdrop and the symbols of the KOTH theme as SVG paths (text), plus path building blocks
// for circles, stars and mountain ridges. Only shapes, no colors: the scenes color the parts via CSS classes (settings).
// Check: hill.check.ts.

// Part of a shape: main/detail = area in main or detail color, line = line only
type ShapePart = { kind: "main" | "detail" | "line"; d: string };
export type Shape = { viewBox: string; parts: readonly ShapePart[] };

const round = (value: number) => Math.round(value * 10) / 10;

// Circle as a path (two arcs), so everything is drawn uniformly as <path>
export const circle = (x: number, y: number, radius: number) =>
  `M${round(x - radius)} ${y} a${radius} ${radius} 0 1 0 ${radius * 2} 0 a${radius} ${radius} 0 1 0 ${-radius * 2} 0 Z`;

// Star: count points around (x, y), points on radius, valleys depth further inside
export function spikes(x: number, y: number, radius: number, depth: number, count: number) {
  const points = Array.from({ length: count * 2 }, (_, index) => {
    const angle = (index * Math.PI) / count - Math.PI / 2;
    const reach = index % 2 ? radius - depth : radius;
    return `${round(x + reach * Math.cos(angle))} ${round(y + reach * Math.sin(angle))}`;
  });
  return `M${points.join(" L")} Z`;
}

// Backdrop (scenes and banners): the hill in the middle, its right slope in the shadow, a few trenches
export const HILL: Shape = {
  viewBox: "0 0 1920 600",
  parts: [
    { kind: "main", d: "M0 600 L0 470 C300 440 520 330 760 210 C840 170 900 150 960 150 C1020 150 1080 170 1160 210 C1400 330 1620 440 1920 470 L1920 600 Z" },
    { kind: "detail", d: "M960 150 C1020 150 1080 170 1160 210 C1400 330 1620 440 1920 470 L1920 600 L1100 600 C1060 420 1000 260 960 150 Z" },
    { kind: "line", d: "M420 420 L470 412 M640 300 L690 296 M1260 300 L1310 306 M1500 410 L1560 418" },
  ],
};
// Radio mast on the hilltop: lattice tower with guy wires
export const TOWER: Shape = {
  viewBox: "0 0 120 300",
  parts: [
    { kind: "line", d: "M48 300 L58 20 L62 20 L72 300 M50 260 L70 220 M70 260 L50 220 M52 200 L68 160 M68 200 L52 160 M54 140 L66 100 M66 140 L54 100 M56 80 L64 40 M64 80 L56 40 M60 30 L4 300 M60 30 L116 300" },
    { kind: "main", d: "M44 296 L76 296 L76 300 L44 300 Z" },
  ],
};
// The flag on its pole (the cloth in main color)
export const FLAG: Shape = {
  viewBox: "0 0 100 160",
  parts: [
    { kind: "line", d: "M10 160 L10 4" },
    { kind: "main", d: "M12 8 C40 0 60 18 96 10 L96 60 C60 68 40 50 12 58 Z" },
  ],
};
export const SANDBAGS: Shape = {
  viewBox: "0 0 200 80",
  parts: [
    { kind: "main", d: "M4 76 C4 56 46 56 46 76 Z M48 76 C48 56 90 56 90 76 Z M92 76 C92 56 134 56 134 76 Z M136 76 C136 56 178 56 178 76 Z M26 56 C26 36 68 36 68 56 Z M70 56 C70 36 112 36 112 56 Z M114 56 C114 36 156 36 156 56 Z" },
    { kind: "line", d: "M8 72 L42 72 M52 72 L86 72 M96 72 L130 72 M140 72 L174 72 M30 52 L64 52 M74 52 L108 52 M118 52 L152 52" },
  ],
};
// Camouflage net stretched between two poles
export const NET: Shape = {
  viewBox: "0 0 240 120",
  parts: [
    { kind: "line", d: "M10 120 L10 20 M230 120 L230 20" },
    { kind: "main", d: "M10 20 C60 40 180 40 230 20 L220 70 C180 80 60 80 20 70 Z" },
    { kind: "detail", d: `${circle(50, 46, 9)} ${circle(96, 56, 11)} ${circle(146, 50, 10)} ${circle(196, 44, 8)}` },
  ],
};
// A column of smoke on the horizon
export const SMOKE: Shape = {
  viewBox: "0 0 120 160",
  parts: [{ kind: "main", d: `${circle(60, 130, 26)} ${circle(48, 92, 22)} ${circle(70, 60, 20)} ${circle(56, 28, 16)}` }],
};
// Helicopter pulling the ticker
export const HELI: Shape = {
  viewBox: "0 0 140 70",
  parts: [
    { kind: "main", d: "M30 30 C30 18 50 14 70 14 C96 14 110 24 110 36 C110 48 96 52 70 52 L44 52 C36 52 30 44 30 30 Z M110 32 L136 28 L136 36 L110 38 Z" },
    { kind: "detail", d: "M76 18 C92 18 104 26 104 34 L76 34 Z" },
    { kind: "line", d: "M20 8 L120 8 M70 8 L70 14 M60 52 L56 62 M84 52 L88 62 M50 64 L96 64" },
  ],
};

// Symbols of the alerts (and decoration), each in 100 x 100
export const ICONS = {
  helm: { viewBox: "0 0 100 100", parts: [
    { kind: "main", d: "M14 66 C14 34 32 16 50 16 C68 16 86 34 86 66 Z M6 66 L94 66 L94 76 L6 76 Z" },
    { kind: "line", d: "M30 40 L40 34 M56 30 L68 36" },
  ] },
  abzeichen: { viewBox: "0 0 100 100", parts: [
    { kind: "main", d: "M14 30 L50 54 L86 30 L86 46 L50 70 L14 46 Z M14 54 L50 78 L86 54 L86 70 L50 94 L14 70 Z" },
    { kind: "detail", d: spikes(50, 22, 16, 9, 5) },
  ] },
  stern: { viewBox: "0 0 100 100", parts: [{ kind: "main", d: spikes(50, 54, 44, 26, 5) }] },
  kiste: { viewBox: "0 0 100 100", parts: [
    { kind: "main", d: "M8 30 L92 30 L92 90 L8 90 Z" },
    { kind: "line", d: "M8 48 L92 48 M8 72 L92 72 M30 30 L30 90 M70 30 L70 90" },
    { kind: "detail", d: "M40 52 L60 52 L60 68 L40 68 Z" },
  ] },
  fallschirm: { viewBox: "0 0 100 100", parts: [
    { kind: "main", d: "M6 44 C6 18 28 4 50 4 C72 4 94 18 94 44 C80 36 64 36 50 44 C36 36 20 36 6 44 Z" },
    { kind: "line", d: "M6 44 L46 82 M94 44 L54 82 M50 44 L50 82" },
    { kind: "detail", d: "M42 80 L58 80 L58 96 L42 96 Z" },
  ] },
  granate: { viewBox: "0 0 100 100", parts: [
    { kind: "main", d: circle(50, 60, 32) },
    { kind: "detail", d: "M40 22 L60 22 L60 32 L40 32 Z M60 24 L80 14 L82 20 L62 30 Z" },
    { kind: "line", d: "M24 52 L76 52 M24 68 L76 68 M42 30 L42 90 M58 30 L58 90" },
  ] },
  funk: { viewBox: "0 0 100 100", parts: [
    { kind: "main", d: "M22 30 L78 30 L78 94 L22 94 Z" },
    { kind: "detail", d: "M30 40 L70 40 L70 56 L30 56 Z" },
    { kind: "line", d: "M66 30 L76 4 M32 68 L46 68 M32 80 L46 80 M58 68 L68 68 M58 80 L68 80" },
  ] },
  flagge: { viewBox: "0 0 100 100", parts: [
    { kind: "line", d: "M14 96 L14 6" },
    { kind: "main", d: "M16 8 C40 2 58 16 90 10 L90 52 C58 58 40 44 16 50 Z" },
  ] },
} as const satisfies Record<string, Shape>;

export type IconName = keyof typeof ICONS;
export const ICON_NAMES = Object.keys(ICONS) as IconName[];
