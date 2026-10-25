// Fine-tuning fields of the Chaos theme, group "Feinschliff: Allgemein" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const GENERAL_TUNING = [
  number("topLeftTop", "oben links: Lage oben", "Feinschliff: Allgemein", 70, -280, 280, "px"),
  number("topLeftTop2", "oben links: Lage oben (2)", "Feinschliff: Allgemein", -3, -12, 12),
  number("topLeftLeft", "oben links: Lage links", "Feinschliff: Allgemein", 70, -280, 280, "px"),
  number("topLeftLeft2", "oben links: Lage links (2)", "Feinschliff: Allgemein", -3, -12, 12),
  number("topRightTop", "oben rechts: Lage oben", "Feinschliff: Allgemein", 70, -280, 280, "px"),
  number("topRightTop2", "oben rechts: Lage oben (2)", "Feinschliff: Allgemein", -3, -12, 12),
  number("topRightRight", "oben rechts: Lage rechts", "Feinschliff: Allgemein", 70, -280, 280, "px"),
  number("topRightRight2", "oben rechts: Lage rechts (2)", "Feinschliff: Allgemein", -3, -12, 12),
  number("bottomRightBottom", "unten rechts: Lage unten", "Feinschliff: Allgemein", 70, -280, 280, "px"),
  number("bottomRightBottom2", "unten rechts: Lage unten (2)", "Feinschliff: Allgemein", -3, -12, 12),
  number("bottomRightRight", "unten rechts: Lage rechts", "Feinschliff: Allgemein", 70, -280, 280, "px"),
  number("bottomRightRight2", "unten rechts: Lage rechts (2)", "Feinschliff: Allgemein", -3, -12, 12),
  number("bottomLeftBottom", "unten links: Lage unten", "Feinschliff: Allgemein", 70, -280, 280, "px"),
  number("bottomLeftBottom2", "unten links: Lage unten (2)", "Feinschliff: Allgemein", -3, -12, 12),
  number("bottomLeftLeft", "unten links: Lage links", "Feinschliff: Allgemein", 70, -280, 280, "px"),
  number("bottomLeftLeft2", "unten links: Lage links (2)", "Feinschliff: Allgemein", -3, -12, 12),
  number("rootLineHeight", "Theme: Zeilenhöhe", "Feinschliff: Allgemein", 1.25, 0.5, 3, undefined, 0.01),
] as const satisfies readonly SettingField[];
