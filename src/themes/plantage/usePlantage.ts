// Values of the Plantage theme in a scene: the resolved settings from the context (set in main.tsx)
// with their type from settings.ts, plus the placeholders {channel} and {login}.
import { streamer } from "../../core/connection.ts";
import { channelNames } from "../../core/template.ts";
import { useThemeValues } from "../../core/hooks/useSettings.ts";
import type { PlantageValues } from "./settings.ts";

export const usePlantage = () => useThemeValues() as unknown as PlantageValues;

// {channel} = channel name from the settings, {login} = Twitch login (without a streamer the channel name in lower case)
export const plantageNames = (values: PlantageValues) => channelNames(values.channelName, streamer);
