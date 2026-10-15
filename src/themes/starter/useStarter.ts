// Werte des Starter-Themes in einer Szene: die aufgelösten Einstellungen aus dem Kontext (gesetzt in main.tsx)
// mit ihrem Typ aus settings.ts, dazu die Platzhalter {channel} und {login}.
import { streamer } from "../../core/connection.ts";
import { useThemeValues } from "../../core/hooks/useSettings.ts";
import type { StarterValues } from "./settings.ts";

export const useStarter = () => useThemeValues() as unknown as StarterValues;

// {channel} = Kanal-Name aus den Einstellungen, {login} = Twitch-Login (ohne Streamer der Kanal-Name klein)
export const starterNames = (values: StarterValues) => ({ channel: values.channelName, login: streamer ?? values.channelName.toLowerCase() });
