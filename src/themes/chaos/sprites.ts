// Pre-rendered scribbles (PERF-CHAOS.md proposal 1), the pure part: where the viewBox lands in a canvas it covers like
// preserveAspectRatio "xMidYMid slice", and the box a take is drawn into, which is the region of its filter rounded out
// to whole pixels. The drawing itself is in useMarkSprites.ts. Check: sprites.check.ts.

export type Box = { x: number; y: number; width: number; height: number };

// Scale and offset that put the viewBox into the canvas the way "xMidYMid slice" does: it covers it, centered
export function sliceFit(view: Box, size: { width: number; height: number }) {
  const scale = Math.max(size.width / view.width, size.height / view.height);
  return { scale, x: (size.width - view.width * scale) / 2 - view.x * scale, y: (size.height - view.height * scale) / 2 - view.y * scale };
}

// The filter region of a take: its box plus the share reach of it on every side (x="-40%" width="180%" is 0.4), in
// whole pixels at the scale, so the bitmap and the place it is drawn at match exactly
export function spriteBox(box: Box, reach: number, scale: number): Box {
  const left = Math.floor((box.x - box.width * reach) * scale);
  const top = Math.floor((box.y - box.height * reach) * scale);
  const right = Math.ceil((box.x + box.width * (1 + reach)) * scale);
  const bottom = Math.ceil((box.y + box.height * (1 + reach)) * scale);
  return { x: left / scale, y: top / scale, width: Math.max(1, right - left) / scale, height: Math.max(1, bottom - top) / scale };
}

// The share a filter region reaches beyond the box, from its x attribute ("-40%" is 0.4); without one SVG takes -10%
export const filterReach = (x: string | null) => (x?.endsWith("%") ? Math.max(0, -parseFloat(x) / 100) : 0.1);
