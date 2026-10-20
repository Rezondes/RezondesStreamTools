// Values of the Chaos theme in a scene: the resolved settings from the context (set in main.tsx) with their type from
// settings.ts.
import { useThemeValues } from "../../core/hooks/useSettings.ts";
import type { ChaosValues } from "./settings.ts";

export const useChaos = () => useThemeValues() as unknown as ChaosValues;
