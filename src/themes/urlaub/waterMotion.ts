// Water motion of the Urlaub overlays (PLAN-URLAUB.md package 7): air bubbles rising behind the chat and the levels of
// the wave equalizer of the music player. Everything from the time, the same time gives the same picture.
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

// fixed: how fast the two waves of the equalizer run (rad/s) and how far apart its bars are (rad)
const SWING = { speed: 5.6, step: 0.9 };
const BEAT = { speed: 3.1, step: 1.7 };

// The level of each bar (0.2 to 1): a wave running along the bars, swelled by a second slower one
export function equalizerLevels(seconds: number, bars: number): number[] {
  return Array.from({ length: bars }, (_, bar) => 0.6 + 0.4 * Math.sin(seconds * SWING.speed + bar * SWING.step) * Math.sin(seconds * BEAT.speed + bar * BEAT.step));
}
