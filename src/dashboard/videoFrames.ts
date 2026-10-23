// Pure helpers of the scene recorder (OfflineDownloads.tsx): how long a video runs, which key color the camera frame
// is recorded on and how that color becomes transparent again. A screen capture has no transparency, so the frame
// is drawn on a color its theme does not use and every captured pixel near that color loses its cover. Check:
// videoFrames.check.ts.
import type { SceneName, SettingValues } from "../core/theme.ts";

export type Rgb = readonly [number, number, number];

// fixed: candidates for the key color (green, magenta, blue)
const KEYS: readonly Rgb[] = [[0, 255, 0], [255, 0, 255], [0, 0, 255]];
// fixed: a pixel this close to the key (0..441) is fully transparent, from the outer distance on fully covered
const KEY_DISTANCE = { inner: 70, outer: 150 };
// fixed: the longest video in s (real time recording), the Starting follows its countdown up to that
export const LONGEST_VIDEO = 600;

const hexColor = /^#([0-9a-f]{6})$/i;
const rgbOf = (hex: string): Rgb => {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};
const distance = (one: Rgb, other: Rgb) => Math.hypot(one[0] - other[0], one[1] - other[1], one[2] - other[2]);

// The candidate farthest from every color of the values (so no part of the frame turns transparent)
export function keyColorFor(values: SettingValues): Rgb {
  const colors = Object.values(values).filter((value): value is string => typeof value === "string" && hexColor.test(value)).map(rgbOf);
  const nearest = (key: Rgb) => Math.min(Number.POSITIVE_INFINITY, ...colors.map(color => distance(color, key)));
  return KEYS.reduce((best, key) => (nearest(key) > nearest(best) ? key : best));
}

export const keyHex = (key: Rgb) => key.map(channel => channel.toString(16).padStart(2, "0")).join("");

// RGBA pixels in place: near the key transparent, at the edge partly, the key color taken out of the mixed pixels
export function keyPixels(data: Uint8ClampedArray, key: Rgb) {
  const span = KEY_DISTANCE.outer - KEY_DISTANCE.inner;
  for (let index = 0; index < data.length; index += 4) {
    const pixel: Rgb = [data[index], data[index + 1], data[index + 2]];
    const cover = Math.min(1, Math.max(0, (distance(pixel, key) - KEY_DISTANCE.inner) / span));
    if (cover > 0 && cover < 1) {
      // The pixel was cover * color + (1 - cover) * key: take the key out again
      for (let channel = 0; channel < 3; channel++) data[index + channel] = (pixel[channel] - (1 - cover) * key[channel]) / cover;
    }
    data[index + 3] = Math.round(cover * data[index + 3]);
  }
}

// Seconds of a video: the Starting runs as long as its countdown (if it has one), every other scene the loop length
export function videoSeconds(scene: SceneName, values: SettingValues, loop: number): number {
  const countdown = typeof values.countdown === "number" ? values.countdown : 0;
  const seconds = scene === "starting" && countdown > 0 ? countdown : loop;
  return Math.min(LONGEST_VIDEO, Math.max(1, Math.round(seconds)));
}
