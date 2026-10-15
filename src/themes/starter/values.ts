// Werte des Starter-Themes in einer Szene: die aufgelösten Einstellungen aus dem Kontext (gesetzt in main.tsx)
// mit ihrem Typ aus settings.ts.
import { useThemeValues } from "../../core/hooks/useSettings.ts";
import type { StarterValues } from "./settings.ts";

export const useStarter = () => useThemeValues() as unknown as StarterValues;
