// Shapes of the beach backdrop and the symbols of the Urlaub theme as SVG paths (text), plus path building blocks for stars,
// blossoms, circles and waves. Only shapes, no colors: the scenes color the parts via CSS classes (settings).
// Check: beach.check.ts.

// Part of a shape: main/detail = area in main or detail color, line = line only
type ShapePart = { kind: "main" | "detail" | "line"; d: string };
export type Shape = { viewBox: string; parts: readonly ShapePart[] };

const round = (value: number) => Math.round(value * 10) / 10;

// Circle as a path (two arcs), so everything is drawn uniformly as <path>
export const circle = (x: number, y: number, radius: number) =>
  `M${round(x - radius)} ${y} a${radius} ${radius} 0 1 0 ${radius * 2} 0 a${radius} ${radius} 0 1 0 ${-radius * 2} 0 Z`;

// Star or spiky circle: count points around (x, y), points on radius, valleys depth further inside
export function spikes(x: number, y: number, radius: number, depth: number, count: number) {
  const points = Array.from({ length: count * 2 }, (_, index) => {
    const angle = (index * Math.PI) / count - Math.PI / 2;
    const reach = index % 2 ? radius - depth : radius;
    return `${round(x + reach * Math.cos(angle))} ${round(y + reach * Math.sin(angle))}`;
  });
  return `M${points.join(" L")} Z`;
}

// Blossom: count round petals around (x, y)
export function petals(x: number, y: number, distance: number, size: number, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index * 2 * Math.PI) / count - Math.PI / 2;
    return circle(round(x + distance * Math.cos(angle)), round(y + distance * Math.sin(angle)), size);
  }).join(" ");
}

// Wave area: top edge as a sine around top (amplitude, wavelength), closed at the bottom down to bottom.
// width should be a multiple of the wavelength, then the area can be shifted seamlessly.
export function wavePath(width: number, amplitude: number, wavelength: number, top: number, bottom: number) {
  const steps = Math.max(1, Math.round((width / wavelength) * 16));
  const points = Array.from({ length: steps + 1 }, (_, index) => {
    const x = (index / steps) * width;
    return `${round(x)} ${round(top + amplitude * Math.sin((x / wavelength) * 2 * Math.PI))}`;
  });
  return `M0 ${bottom} L${points.join(" L")} L${width} ${bottom} Z`;
}

// Backdrop (scenes and banners)
export const PALM: Shape = {
  viewBox: "-80 0 320 320",
  parts: [
    { kind: "main", d: "M54 320 C60 230 52 150 70 66 L84 70 C68 150 76 232 74 320 Z" },
    { kind: "line", d: "M58 280 L72 282 M60 230 L74 232 M62 180 L76 183 M66 130 L80 134 M70 90 L82 94" },
    { kind: "detail", d: "M76 66 C40 30 0 34 -30 70 C10 52 44 54 76 66 Z M76 66 C70 20 40 0 6 4 C40 20 60 40 76 66 Z M76 66 C96 20 130 6 166 16 C130 26 104 42 76 66 Z M76 66 C120 40 168 50 200 86 C160 70 120 66 76 66 Z M76 66 C90 100 86 140 70 170 C76 130 74 100 76 66 Z" },
    { kind: "main", d: `${circle(72, 74, 9)} ${circle(88, 72, 9)} ${circle(80, 86, 9)}` },
  ],
};
export const CLOUD: Shape = {
  viewBox: "0 0 120 70",
  parts: [{ kind: "main", d: "M20 60 C10 60 4 52 6 44 C8 34 20 30 28 34 C32 20 48 14 60 20 C68 10 86 12 92 26 C104 26 112 36 108 48 C106 56 98 60 90 60 Z" }],
};
export const LEAF: Shape = {
  viewBox: "0 0 160 80",
  parts: [
    { kind: "main", d: "M4 70 C30 20 90 4 156 10 C110 24 60 44 4 70 Z" },
    { kind: "line", d: "M4 70 C50 40 100 20 156 10 M40 44 L30 30 M70 30 L62 14 M100 20 L96 6 M50 40 L58 52 M84 26 L94 36 M116 16 L126 24" },
  ],
};
export const PLANE: Shape = {
  viewBox: "0 0 120 50",
  parts: [
    { kind: "main", d: "M10 23 L80 20 C96 20 110 22 116 26 C110 30 96 32 80 32 L10 29 Z M46 22 L30 2 L40 2 L64 22 Z M46 30 L30 48 L40 48 L64 30 Z M12 24 L4 10 L11 10 L22 24 Z" },
    { kind: "detail", d: `${circle(88, 25, 2.5)} ${circle(96, 25, 2.5)} ${circle(104, 25, 2.5)}` },
  ],
};
export const GULL: Shape = {
  viewBox: "0 0 48 16",
  parts: [{ kind: "line", d: "M2 10 C8 2 18 2 24 10 C30 2 40 2 46 10" }],
};

// Symbols of the alerts (and decoration), each in 100 x 100
export const ICONS = {
  muschel: { viewBox: "0 0 100 100", parts: [
    { kind: "main", d: "M50 90 L14 46 C14 26 30 12 50 12 C70 12 86 26 86 46 Z" },
    { kind: "line", d: "M50 90 L30 18 M50 90 L50 12 M50 90 L70 18 M50 90 L18 38 M50 90 L82 38" },
  ] },
  seestern: { viewBox: "0 0 100 100", parts: [
    { kind: "main", d: spikes(50, 54, 44, 26, 5) },
    { kind: "detail", d: `${circle(50, 32, 3)} ${circle(70, 48, 3)} ${circle(30, 48, 3)} ${circle(62, 72, 3)} ${circle(38, 72, 3)}` },
  ] },
  sonne: { viewBox: "0 0 100 100", parts: [
    { kind: "main", d: circle(50, 50, 22) },
    { kind: "line", d: "M50 6 L50 20 M50 80 L50 94 M6 50 L20 50 M80 50 L94 50 M19 19 L29 29 M71 71 L81 81 M81 19 L71 29 M29 71 L19 81" },
  ] },
  welle: { viewBox: "0 0 100 100", parts: [
    { kind: "main", d: "M4 70 C18 40 40 28 58 38 C46 44 42 54 48 62 C58 72 78 62 96 50 L96 96 L4 96 Z" },
    { kind: "line", d: "M58 38 C66 42 70 50 64 56" },
  ] },
  hibiskus: { viewBox: "0 0 100 100", parts: [
    { kind: "main", d: petals(50, 50, 24, 20, 5) },
    { kind: "detail", d: circle(50, 50, 10) },
    { kind: "line", d: "M50 50 L62 26 M62 26 L66 22" },
  ] },
  boot: { viewBox: "0 0 100 100", parts: [
    { kind: "main", d: "M8 70 L92 70 L78 88 L22 88 Z" },
    { kind: "detail", d: "M48 14 L48 64 L18 64 Z M56 20 L56 64 L84 64 Z" },
    { kind: "line", d: "M52 8 L52 70" },
  ] },
  kokosnuss: { viewBox: "0 0 100 100", parts: [
    { kind: "main", d: circle(50, 54, 40) },
    { kind: "detail", d: `${circle(40, 30, 5)} ${circle(60, 30, 5)} ${circle(50, 42, 5)}` },
  ] },
  ananas: { viewBox: "0 0 100 100", parts: [
    { kind: "main", d: "M50 30 C70 30 80 48 80 65 C80 84 66 96 50 96 C34 96 20 84 20 65 C20 48 30 30 50 30 Z" },
    { kind: "line", d: "M28 48 L72 88 M28 64 L56 92 M40 34 L78 70 M72 48 L28 88 M72 64 L44 92 M60 34 L22 70" },
    { kind: "detail", d: "M50 32 L36 4 L46 22 L50 0 L54 22 L64 4 Z" },
  ] },
} as const satisfies Record<string, Shape>;

export type IconName = keyof typeof ICONS;
export const ICON_NAMES = Object.keys(ICONS) as IconName[];
