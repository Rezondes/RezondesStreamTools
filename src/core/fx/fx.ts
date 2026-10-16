// Kontext Effekte (Chat-Trigger, Szene fx): welche Einstellungen der Kern für alle Themes liest und welche Standardwerte
// eine Aktion bekommt, die Dauer oder Grösse nicht selbst angibt. Rein; Check: fx.check.ts.
import type { FxAction } from "../types.ts";

// Schlüssel im Schema jedes Themes mit Effekten; gelten im Schema-Check als benutzt
export const FX_KEYS = ["fxMax", "fxDuration", "fxSize", "fxMargin"] as const;
export type FxSettings = Record<(typeof FX_KEYS)[number], number>;

// Standardwerte für Aktionen ohne eigene Dauer oder Grösse
export const fxDefaults = (values: FxSettings): Partial<FxAction> => ({ duration: values.fxDuration, size: values.fxSize });
