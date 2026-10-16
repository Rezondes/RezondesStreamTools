// Werte des Standard-Themes in einer Szene: die aufgelösten Einstellungen aus dem Kontext (gesetzt in main.tsx)
// mit ihrem Typ aus settings.ts, dazu die Platzhalter {channel} und {login}.
import { streamer } from "../../core/connection.ts";
import { channelNames } from "../../core/template.ts";
import { useThemeValues } from "../../core/hooks/useSettings.ts";
import type { StandardValues } from "./settings.ts";

export const useStandard = () => useThemeValues() as unknown as StandardValues;

// {channel} = Kanal-Name aus den Einstellungen, {login} = Twitch-Login (ohne Streamer der Kanal-Name klein)
export const standardNames = (values: StandardValues) => channelNames(values.channelName, streamer);
