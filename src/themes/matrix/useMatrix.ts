// Werte des Matrix-Themes in einer Szene: die aufgelösten Einstellungen aus dem Kontext (gesetzt in main.tsx)
// mit ihrem Typ, dazu die Platzhalter, die in vielen Texten vorkommen ({channel}, {login}).
import { streamer } from "../../core/connection.ts";
import { channelNames } from "../../core/template.ts";
import { useThemeValues } from "../../core/hooks/useSettings.ts";
import type { MatrixValues } from "./settings.ts";

// main.tsx löst die Werte gegen dieses Schema auf (resolveSettings), darum hat jeder Schlüssel seinen Typ
export const useMatrix = () => useThemeValues() as unknown as MatrixValues;

// {channel} = Kanal-Name aus den Einstellungen, {login} = Twitch-Login des Streamers (ohne Streamer der Kanal-Name klein)
export const placeholders = (values: MatrixValues) => channelNames(values.channelName, streamer);
