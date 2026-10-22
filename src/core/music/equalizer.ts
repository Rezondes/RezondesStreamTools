// Levels of a music equalizer drawn by a theme (Urlaub waves, Plantage mangos): Spotify gives no audio data, so a wave
// runs along the bars, swelled by a second slower one; the same time gives the same levels. Check: equalizer.check.ts.

// fixed: how fast the two waves run (rad/s) and how far apart its bars are (rad)
const SWING = { speed: 5.6, step: 0.9 };
const BEAT = { speed: 3.1, step: 1.7 };

// The level of each bar (0.2 to 1)
export function equalizerLevels(seconds: number, bars: number): number[] {
  return Array.from({ length: bars }, (_, bar) => 0.6 + 0.4 * Math.sin(seconds * SWING.speed + bar * SWING.step) * Math.sin(seconds * BEAT.speed + bar * BEAT.step));
}
