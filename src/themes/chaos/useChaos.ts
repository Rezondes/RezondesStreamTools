// Values of the Chaos theme in a scene: the resolved settings from the context (set in main.tsx) with their type from
// settings.ts, plus the placeholders {channel} and {login}.
import { streamer } from "../../core/connection.ts";
import { useThemeValues } from "../../core/hooks/useSettings.ts";
import { channelNames } from "../../core/template.ts";
import type { ChaosValues } from "./settings.ts";

export const useChaos = () => useThemeValues() as unknown as ChaosValues;

// {channel} = channel name from the settings, {login} = Twitch login (without a streamer the channel name in lower case)
export const chaosNames = (values: ChaosValues) => channelNames(values.channelName, streamer);
