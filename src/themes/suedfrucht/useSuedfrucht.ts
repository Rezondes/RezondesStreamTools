// Werte des Südfrucht-Themes in einer Szene: die aufgelösten Einstellungen aus dem Kontext (gesetzt in main.tsx)
// mit ihrem Typ aus settings.ts, dazu die Platzhalter {channel} und {login}.
import { streamer } from "../../core/connection.ts";
import { useThemeValues } from "../../core/hooks/useSettings.ts";
import type { SuedfruchtValues } from "./settings.ts";

export const useSuedfrucht = () => useThemeValues() as unknown as SuedfruchtValues;

// {channel} = Kanal-Name aus den Einstellungen, {login} = Twitch-Login (ohne Streamer der Kanal-Name klein)
export const suedfruchtNames = (values: SuedfruchtValues) => ({ channel: values.channelName, login: streamer ?? values.channelName.toLowerCase() });
