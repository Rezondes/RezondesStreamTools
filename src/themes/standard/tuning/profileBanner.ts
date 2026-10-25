// Fine-tuning fields of the Standard theme, group "Profilbanner" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const PROFILE_BANNER_TUNING = [
  inherits(color("bannerProfileBackground", "Hintergrund", "Profilbanner", ""), "background"),
  inherits(color("bannerProfileTitleColor", "Titel: Farbe", "Profilbanner", ""), "textColor"),
  inherits(color("bannerProfileTextColor", "Text: Farbe", "Profilbanner", ""), "mutedColor"),
  inherits(color("bannerProfileBarColor", "Balken: Farbe 1", "Profilbanner", ""), "accent"),
  inherits(color("bannerProfileBarColor2", "Balken: Farbe 2", "Profilbanner", ""), "accent2"),
  inherits(font("bannerProfileFont", "Schrift", "Profilbanner", "", ["Inter", "Manrope", "DM Sans", "Space Grotesk"]), "font"),
  number("bannerProfileLeft", "Abstand links", "Profilbanner", 360, 0, 1200, "px"),
  number("bannerProfileTitleY", "Titel: Grundlinie", "Profilbanner", 220, 0, 480, "px"),
  number("bannerProfileTitleSize", "Titel: Grösse", "Profilbanner", 96, 8, 400, "px"),
  number("bannerProfileTitleWeight", "Titel: Schriftstärke", "Profilbanner", 800, 100, 900, undefined, 100),
  number("bannerProfileBarY", "Balken: Lage oben", "Profilbanner", 248, 0, 480, "px"),
  number("bannerProfileBarWidth", "Balken: Breite höchstens", "Profilbanner", 420, 0, 1200, "px"),
  number("bannerProfileBarHeight", "Balken: Höhe", "Profilbanner", 8, 0, 100, "px"),
  number("bannerProfileTextY", "Text: Grundlinie", "Profilbanner", 312, 0, 480, "px"),
  number("bannerProfileTextSize", "Text: Grösse", "Profilbanner", 34, 8, 200, "px"),
  number("bannerProfileTextWeight", "Text: Schriftstärke", "Profilbanner", 500, 100, 900, undefined, 100),
] as const satisfies readonly SettingField[];
