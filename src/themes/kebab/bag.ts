// Shapes of the paper bag of the alert variant "tuete" (DESIGN-KEBAB.md "Tüte", prototype refs/alert.html) in a box of
// 400 x 480: the bag with its zigzag top and side folds, the small spit printed on its front. The arc title, the dish,
// the name and the line are text in the scene. Check: bag.check.ts.
import type { InkLine, InkPart } from "./chef.ts";

export const BAG_BOX = { width: 400, height: 480 };
// Where the texts sit on the bag (center x, baseline y) and how wide the name may be before it is squeezed
export const BAG_TEXT = { x: 200, dish: 352, name: 412, line: 448, nameWidth: 268 };
// The arc title on the bag: center, radius and angle of its arc, letter size
export const BAG_ARC = { center: { x: 200, y: 400 }, radius: 230, span: 64, size: 38 };
// Where the steam leaves the bag
export const BAG_TOP = { x: 200, y: 70 };

const path = (outline: string, width = 3): InkLine => ({ shape: { kind: "path", d: outline }, width });
const BODY = "M44 100 L356 100 L372 470 L28 470 Z";
const CONE = "M184 214 C192 211 208 211 216 214 C222 240 222 266 214 286 L210 300 L190 300 L186 286 C178 266 178 240 184 214 Z";

function zigzag(): string {
  const points = [];
  for (let x = 44, up = false; x <= 356; x += 12, up = !up) points.push(`${x} ${up ? 80 : 100}`);
  return `M${points.join(" L")}`;
}

export function bagParts(): { bag: InkPart; print: InkPart } {
  return {
    bag: { fills: [BODY], lines: [path(BODY, 3.4), path(zigzag(), 2.6), path("M60 470 L70 130 M340 470 L330 130 M44 100 L70 130 M356 100 L330 130", 2)], dots: [] },
    print: {
      fills: [CONE],
      lines: [
        path("M182 196 L218 196 M200 196 L200 214 M200 300 L200 318", 3),
        path(CONE, 3),
        path("M188 226 Q194 224 200 226 M200 238 Q206 236 212 238 M186 250 Q192 248 198 250 M202 262 Q208 260 214 262 M190 276 Q196 274 202 276 M198 288 Q203 286 208 288", 2),
      ],
      dots: [],
    },
  };
}
