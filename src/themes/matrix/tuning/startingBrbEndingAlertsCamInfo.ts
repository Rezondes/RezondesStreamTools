// Fine-tuning fields of the Matrix theme, group "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite" (tuning.ts puts the groups together).
import { number } from "../../../core/fields.ts";
import type { SettingField } from "../../../core/theme.ts";

export const STARTING_BRB_ENDING_ALERTS_CAM_INFO_TUNING = [
  number("rainFarAlpha", "Regen fern: Deckkraft", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", 0.32, 0, 1, undefined, 0.01),
  number("rainFarSpeedMin", "Regen fern: Tempo mindestens (px pro Sekunde)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", 70, 0, 2000),
  number("rainFarSpeedMax", "Regen fern: Tempo höchstens (px pro Sekunde)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", 140, 0, 3000),
  number("rainFarTrailMin", "Regen fern: Spur mindestens (Zeichen)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", 10, 0, 100),
  number("rainFarTrailMax", "Regen fern: Spur höchstens (Zeichen)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", 26, 0, 100),
  number("rainFarEmpty", "Regen fern: Anteil leerer Spalten", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", 0.15, 0, 1, undefined, 0.01),
  number("rainMidAlpha", "Regen Mitte: Deckkraft", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", 0.65, 0, 1, undefined, 0.01),
  number("rainMidSpeedMin", "Regen Mitte: Tempo mindestens (px pro Sekunde)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", 130, 0, 2000),
  number("rainMidSpeedMax", "Regen Mitte: Tempo höchstens (px pro Sekunde)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", 240, 0, 3000),
  number("rainMidTrailMin", "Regen Mitte: Spur mindestens (Zeichen)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", 12, 0, 100),
  number("rainMidTrailMax", "Regen Mitte: Spur höchstens (Zeichen)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", 28, 0, 100),
  number("rainMidEmpty", "Regen Mitte: Anteil leerer Spalten", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", 0.15, 0, 1, undefined, 0.01),
  number("rainNearAlpha", "Regen nah: Deckkraft", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", 1, 0, 1, undefined, 0.01),
  number("rainNearSpeedMin", "Regen nah: Tempo mindestens (px pro Sekunde)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", 240, 0, 2000),
  number("rainNearSpeedMax", "Regen nah: Tempo höchstens (px pro Sekunde)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", 420, 0, 3000),
  number("rainNearTrailMin", "Regen nah: Spur mindestens (Zeichen)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", 10, 0, 100),
  number("rainNearTrailMax", "Regen nah: Spur höchstens (Zeichen)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", 22, 0, 100),
  number("rainNearEmpty", "Regen nah: Anteil leerer Spalten", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", 0.55, 0, 1, undefined, 0.01),
  number("rainStartSpread", "Regen: Streuung der Starts", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", 2.2, 0, 10, "s", 0.05),
  number("rainLayerDelay", "Regen: jede nähere Ebene startet später um", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", 0.25, 0, 10, "s", 0.05),
  number("rainTip", "Regen: Zeichen der Spitze (wechseln schneller)", "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite", 3, 0, 30),
] as const satisfies readonly SettingField[];
