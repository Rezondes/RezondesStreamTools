// Colors as numbers and mixes for drawing with PixiJS or a canvas: #rrggbb to a number, and a mix of two colors (air
// perspective, dusk). Check: color.check.ts.

// #rrggbb (or #rgb) as 0xrrggbb
export function hexNumber(hex: string): number {
  const digits = hex.replace("#", "");
  const full = digits.length === 3 ? [...digits].map(digit => digit + digit).join("") : digits;
  return parseInt(full.slice(0, 6), 16) || 0;
}

// Mix of two colors: part of the second one from 0 to 1, as #rrggbb
export function mixHex(base: string, other: string, part: number): string {
  const [from, to] = [hexNumber(base), hexNumber(other)];
  const share = Math.min(1, Math.max(0, part));
  const channel = (color: number, shift: number) => (color >> shift) & 255;
  return `#${[16, 8, 0].map(shift => Math.round(channel(from, shift) + (channel(to, shift) - channel(from, shift)) * share).toString(16).padStart(2, "0")).join("")}`;
}
