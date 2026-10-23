// Shapes of the chef at the spit in the 600 x 520 grid of the printed logo (DESIGN-KEBAB.md "Formen", prototype
// refs/starting.html): per part the paper fills that hide lines behind it, the ink lines with their width and the dots
// (pupils, buttons). Only shapes, no colors; Ink.tsx draws them with Rough.js and the colors of the settings.
// Check: chef.check.ts.
import type { RoughShape } from "../../core/rough/roughSvg.ts";

export type InkLine = { shape: RoughShape; width: number };
export type InkDot = { x: number; y: number; radius: number; filled: boolean };
export type InkPart = { fills: readonly string[]; lines: readonly InkLine[]; dots: readonly InkDot[] };

export const CHEF_PARTS = ["hat", "head", "face", "eyes", "stache", "body", "spit", "meat", "arm", "knife", "counter", "plate"] as const;
export type ChefPart = (typeof CHEF_PARTS)[number];

// The grid of the logo and the part of it a full-screen scene shows
export const GRID = { width: 600, height: 520 };
export const VIEW = { x: 30, y: 70, width: 540, height: 410 };
// Where the logo SVG sits on the 1920 x 1080 stage of a full-screen scene (left, top, height in px), and a point of
// the grid on that stage (PixiJS draws shavings and steam in stage pixels)
export const LOGO_BOX = { left: 120, top: 60, height: 940 };
export function toStage(point: { x: number; y: number }, box = LOGO_BOX) {
  const scale = box.height / VIEW.height;
  return { x: box.left + (point.x - VIEW.x) * scale, y: box.top + (point.y - VIEW.y) * scale, scale };
}
// Outline of the meat cone; its strokes are clipped to it
export const MEAT = "M286 205 C300 199 340 199 354 205 C364 250 364 300 354 340 C348 370 344 395 340 412 L300 412 C296 395 292 370 286 340 C276 300 276 250 286 205 Z";
// Pivots: the arm turns around the shoulder, the hat around its band, the moustache around its middle, eyes blink at their height
export const SHOULDER = { x: 150, y: 362 };
export const HAT_PIVOT = { x: 215, y: 262 };
export const STACHE_PIVOT = { x: 216, y: 310 };
export const EYE_LINE = 285;
// Where the knife leaves the meat and the shavings start, where they land
export const CUT = { x: 334, y: 356 };
export const PLATE = { x: 296, y: 452 };
// Where steam rises over the spit
export const SPIT_TOP = { x: 320, y: 196 };

const path = (outline: string, width = 3): InkLine => ({ shape: { kind: "path", d: outline }, width });
const part = (lines: InkLine[], fills: string[] = [], dots: InkDot[] = []): InkPart => ({ fills, lines, dots });

const HAT = "M178 250 C164 242 160 216 176 206 C170 184 196 170 211 183 C221 167 247 172 249 191 C267 193 270 220 252 230 L251 250";
const STACHE = "M186 313 C192 299 210 301 216 308 C222 301 240 299 246 313 C241 309 234 315 226 316 C221 317 211 317 206 316 C198 315 191 309 186 313 Z";
const SLEEVE = "M150 362 C137 384 141 404 160 410 L220 401 C236 405 248 397 245 387 C242 378 230 376 218 383 L174 391 C167 388 164 380 166 368 Z";
const BLADE = "M262 377 L424 309 L427 316 L266 388 Z";
const BUTTONS: InkDot[] = [[230, 362], [232, 384], [234, 406], [208, 364], [209, 386], [210, 408]].map(([x, y]) => ({ x, y, radius: 3.2, filled: false }));

export function chefParts(): Record<ChefPart, InkPart> {
  return {
    hat: part([path(HAT), path("M178 250 L251 250 M180 250 L182 264 M251 250 L249 264 M182 264 L249 264"), path("M200 214 C205 228 205 240 203 250 M226 208 C229 226 229 240 227 250", 2.4)], [`${HAT} Z`]),
    head: part([path("M184 264 C178 286 181 305 193 318 C205 330 228 330 240 318 C251 305 252 286 247 264"), path("M247 281 C257 279 259 297 246 299 M184 281 C175 280 174 297 186 299", 2.6)]),
    face: part([path("M196 276 Q204 270 212 275 M220 275 Q228 270 236 276", 2.6), path("M215 286 C210 297 211 303 218 302", 2.6), path("M207 321 Q216 327 225 321", 2.4)]),
    eyes: part([path("M200 285 Q205 281 210 285 M222 285 Q227 281 232 285", 2.4)], [], [{ x: 205, y: 286, radius: 2.2, filled: true }, { x: 227, y: 286, radius: 2.2, filled: true }]),
    stache: part([path(STACHE, 2.8)], [STACHE]),
    body: part([
      path("M201 334 L214 340 L201 347 Z M231 334 L218 340 L231 347 Z", 2.4),
      path("M196 330 C168 336 152 350 148 372 L142 432 M236 330 C252 336 262 344 268 356"),
      path("M216 348 L222 432 M199 344 C203 380 205 406 204 432", 2.6),
      path("M268 356 C276 370 280 384 284 396", 2.8),
    ], [], BUTTONS),
    spit: part([path("M298 164 L342 164 M320 164 L320 204 M320 412 L320 448", 3.4)]),
    meat: part([path(MEAT, 3.2)], [MEAT]),
    arm: part([path("M150 362 C137 384 141 404 160 410 L220 401 M166 368 C164 380 167 388 174 391 L218 383"), path("M218 383 C230 376 242 378 245 387 C248 397 236 405 220 401", 2.8), path("M200 386 L203 405", 2.4)], [SLEEVE]),
    knife: part([path("M238 384 L262 377 L266 388 L242 395 Z", 2.8), path("M262 377 L424 309 L427 316 L266 388", 2.8)], [BLADE]),
    counter: part([path("M132 432 L438 432", 3.6)]),
    plate: part([{ shape: { kind: "ellipse", x: 296, y: 458, width: 150, height: 24 }, width: 3 }, { shape: { kind: "ellipse", x: 296, y: 458, width: 100, height: 13 }, width: 2.2 }]),
  };
}

// Every coordinate pair of a path (numbers in pairs after the command letters, relative "q t" pairs are not used here)
export function pathPoints(outline: string): { x: number; y: number }[] {
  const numbers = (outline.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  const points: { x: number; y: number }[] = [];
  for (let pair = 0; pair + 1 < numbers.length; pair += 2) points.push({ x: numbers[pair], y: numbers[pair + 1] });
  return points;
}
