// Fine-tuning fields of the King of the Hill theme, group "Profilbanner" (tuning.ts puts the groups together).
import { color, font, inherits, number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const PROFILE_BANNER_TUNING = [
  inherits(color("profileTextColor", "Text: Farbe", "Profilbanner", ""), "textColor"),
  inherits(font("profileTitleFont", "Titel: Schrift", "Profilbanner", "", ["Black Ops One", "Stardos Stencil", "Share Tech Mono", "Inter"]), "titleFont"),
  inherits(font("profileFont", "Zeile: Schrift", "Profilbanner", "", ["Inter", "Share Tech Mono", "IBM Plex Mono", "DM Sans"]), "font"),
  number("profileTitleSize", "Titel: Schriftgrösse", "Profilbanner", 90, 8, 300, "px"),
  number("profileTitleX", "Titel: von links", "Profilbanner", 60, -1200, 1200, "px"),
  number("profileTitleY", "Titel: von oben", "Profilbanner", 110, -480, 480, "px"),
  number("profileTextSize", "Zeile: Schriftgrösse", "Profilbanner", 32, 8, 200, "px"),
  number("profileTextX", "Zeile: von links", "Profilbanner", 64, -1200, 1200, "px"),
  number("profileTextY", "Zeile: von oben", "Profilbanner", 180, -480, 480, "px"),
  number("profileShadowAlpha", "Textschatten: Deckkraft", "Profilbanner", 0.55, 0, 1, undefined, 0.01),
  number("profileShadowBlur", "Textschatten: Unschärfe", "Profilbanner", 14, 0, 100, "px"),
  inherits(color("profileSkyTop", "Himmel oben", "Profilbanner", ""), "skyTop"),
  inherits(color("profileSkyHorizon", "Himmel am Horizont", "Profilbanner", ""), "skyHorizon"),
  inherits(color("profileSandColor", "Welt: Sand", "Profilbanner", ""), "sandColor"),
  inherits(color("profileHillColor", "Welt: Hügel", "Profilbanner", ""), "hillColor"),
  inherits(color("profileShadeColor", "Welt: Hügel im Schatten und Kiefern", "Profilbanner", ""), "hillDark"),
  inherits(color("profileMountainColor", "Welt: Berge und Felsen", "Profilbanner", ""), "mountainColor"),
  inherits(color("profileSteelColor", "Welt: Funkmast", "Profilbanner", ""), "steel"),
  inherits(color("profileLightColor", "Welt: Licht", "Profilbanner", ""), "sunColor"),
  number("profileFov", "Kamera: Blickwinkel (Grad)", "Profilbanner", 34, 10, 120),
  number("profileTurn", "Kamera: Winkel auf dem Kreis (Bogenmass)", "Profilbanner", 0.35, 0, 6.3, undefined, 0.01),
  number("profileAmbient", "Licht: Grundhelligkeit", "Profilbanner", 0.9, 0, 5, undefined, 0.05),
  number("profileSun", "Licht: Sonne", "Profilbanner", 2.2, 0, 10, undefined, 0.05),
  number("profileFogNear", "Nebel: ab (m)", "Profilbanner", 50, 0, 400),
  number("profileFogFar", "Nebel: dicht bei (m)", "Profilbanner", 210, 0, 400),
  number("profileFogMix", "Nebel: Anteil der Horizontfarbe", "Profilbanner", 0.8, 0, 1, undefined, 0.01),
  number("profileFlagWidth", "Flagge: Breite (m)", "Profilbanner", 2.8, 0, 10, undefined, 0.1),
  number("profileFlagHeight", "Flagge: Höhe (m)", "Profilbanner", 1.75, 0, 10, undefined, 0.05),
] as const satisfies readonly SettingField[];
