// Symbols of the alert kinds of the Bärenbande theme as SVG paths in a 100 x 100 box (shapes only, colored and outlined
// via CSS like the bears): paw, heart, star, fish, honey pot, phone, chef's hat, leaf. Check: icons.check.ts.
import { dot, oval } from "./bears.ts";

export const ICON_NAMES = ["pfote", "herz", "stern", "fisch", "honig", "handy", "muetze", "blatt"] as const;
export type IconName = (typeof ICON_NAMES)[number];

// fill: the colored shape (outlined), detail: a second tone on top, line: open lines
export type Icon = { fill: string; detail?: string; line?: string };

export const ICONS: Record<IconName, Icon> = {
  pfote: {
    fill: `M30 62 C30 46 70 46 70 62 C72 78 60 86 50 84 C40 86 28 78 30 62 Z ${oval(24, 40, 8, 11)} ${oval(40, 26, 8, 11)} ${oval(60, 26, 8, 11)} ${oval(76, 40, 8, 11)}`,
  },
  herz: { fill: "M50 86 C20 66 8 50 12 32 C16 16 38 12 50 30 C62 12 84 16 88 32 C92 50 80 66 50 86 Z", line: "M28 32 C30 26 36 24 40 26" },
  stern: { fill: "M50 8 L61 36 L91 38 L68 57 L76 87 L50 70 L24 87 L32 57 L9 38 L39 36 Z" },
  fisch: {
    fill: "M12 50 C26 28 58 24 76 44 L92 30 L90 70 L76 56 C58 76 26 72 12 50 Z",
    detail: dot(32, 46, 4),
    line: "M52 36 C58 44 58 56 52 64",
  },
  honig: {
    fill: "M26 34 L74 34 C86 44 88 70 76 84 C64 92 36 92 24 84 C12 70 14 44 26 34 Z M22 24 L78 24 L78 34 L22 34 Z",
    detail: "M24 50 C36 56 64 56 76 50 C78 58 78 64 76 70 C64 76 36 76 24 70 C22 64 22 58 24 50 Z",
  },
  handy: { fill: "M30 12 C30 8 34 6 38 6 L62 6 C66 6 70 8 70 12 L70 88 C70 92 66 94 62 94 L38 94 C34 94 30 92 30 88 Z", detail: "M36 16 L64 16 L64 80 L36 80 Z" },
  muetze: {
    fill: "M28 60 C10 56 12 30 30 32 C32 12 68 12 70 32 C88 30 90 56 72 60 L70 86 L30 86 Z",
    line: "M30 70 L70 70 M42 60 L42 70 M58 60 L58 70",
  },
  blatt: { fill: "M14 86 C14 46 40 14 88 12 C86 60 56 86 14 86 Z", line: "M18 82 C40 60 60 40 80 20 M44 58 L40 40 M58 44 L70 46" },
};
