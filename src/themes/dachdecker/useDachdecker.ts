// Values of the Dachdecker theme in a scene: the resolved settings from the context (set in main.tsx) with their type
// from settings.ts, plus the placeholders {channel}, {login} and {date}.
import { streamer } from "../../core/connection.ts";
import { useThemeValues } from "../../core/hooks/useSettings.ts";
import { channelNames } from "../../core/template.ts";
import type { DachdeckerValues } from "./settings.ts";

export const useDachdecker = () => useThemeValues() as unknown as DachdeckerValues;

// {channel} = channel name from the settings, {login} = Twitch login, {date} = today as on a drawing (year-month-day)
export const dachdeckerNames = (values: DachdeckerValues, now: number) => ({
  ...channelNames(values.channelName, streamer),
  date: new Date(now).toLocaleDateString("sv-SE"),
});
