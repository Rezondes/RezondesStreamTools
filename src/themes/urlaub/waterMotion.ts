// Water motion of the Urlaub overlays (PLAN-URLAUB.md package 7): air bubbles rising behind the chat. Everything from the
// time, the same time gives the same picture.
// Check: waterMotion.check.ts.

export type Bubble = { x: number; y: number; radius: number; alpha: number };

// fixed: bubble size (px), sideways wobble (px, per s), spread of the rise speed, the top share where bubbles fade
const RADIUS = { min: 4, by: 10 };
const WOBBLE = { size: 12, speed: 1.5 };
const RISE_SPREAD = { min: 0.6, by: 0.8 };
const FADE_TOP = 0.3;

// A stable pseudo random number in [0, 1) for a bubble and a salt
const noise = (index: number, salt: number) => {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

// Bubble index at seconds in an area of width x height, rising rise px/s on average; it comes back at the bottom
export function bubbleAt(index: number, seconds: number, area: { width: number; height: number }, rise: number): Bubble {
  const radius = RADIUS.min + noise(index, 1) * RADIUS.by;
  const speed = rise * (RISE_SPREAD.min + noise(index, 2) * RISE_SPREAD.by);
  const travel = area.height + 2 * radius;
  const y = area.height + radius - ((seconds * speed + noise(index, 3) * travel) % travel);
  const x = noise(index, 4) * area.width + Math.sin(seconds * WOBBLE.speed + index) * WOBBLE.size;
  return { x, y, radius, alpha: Math.min(1, Math.max(0, y / (area.height * FADE_TOP))) };
}
