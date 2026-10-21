// Values of the KOTH theme in a scene: the resolved settings from the context (set in main.tsx)
// with their type from settings.ts, plus the placeholders {channel} and {login}.
import { streamer } from "../../core/connection.ts";
import { minimeTeamColorKey, minimeTeamLabelKey } from "../../core/minimeFields.ts";
import { channelNames } from "../../core/template.ts";
import { useThemeValues } from "../../core/hooks/useSettings.ts";
import type { KothValues } from "./settings.ts";

export const useKoth = () => useThemeValues() as unknown as KothValues;

// {channel} = channel name from the settings, {login} = Twitch login (without a streamer the channel name in lower case)
export const kothNames = (values: KothValues) => channelNames(values.channelName, streamer);

// Color and shown name of a faction (minime faction fields of the core)
export const teamColor = (values: KothValues, team: string) => String((values as Record<string, unknown>)[minimeTeamColorKey(team)]);
export const teamLabel = (values: KothValues, team: string) => String((values as Record<string, unknown>)[minimeTeamLabelKey(team)]);
