// Values of the matrix theme in a scene: the resolved settings from the context (set in main.tsx)
// with their type, plus the placeholders that occur in many texts ({channel}, {login}).
import { streamer } from "../../core/connection.ts";
import { channelNames } from "../../core/template.ts";
import { useThemeValues } from "../../core/hooks/useSettings.ts";
import type { MatrixValues } from "./settings.ts";

// main.tsx resolves the values against this schema (resolveSettings), so every key has its type
export const useMatrix = () => useThemeValues() as unknown as MatrixValues;

// {channel} = channel name from the settings, {login} = Twitch login of the streamer (without a streamer the channel name in lower case)
export const placeholders = (values: MatrixValues) => channelNames(values.channelName, streamer);
