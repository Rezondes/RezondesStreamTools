// Values of the Kebab theme in a scene: the resolved settings from the context (set in main.tsx) with their type from
// settings.ts, plus the placeholders {channel} and {login} (channelNames) and {shop}.
import { streamer } from "../../core/connection.ts";
import { useThemeValues } from "../../core/hooks/useSettings.ts";
import { channelNames } from "../../core/template.ts";
import type { KebabValues } from "./settings.ts";

export const useKebab = () => useThemeValues() as unknown as KebabValues;

// {channel} and {shop} = the shop name from the settings, {login} = Twitch login
export const kebabNames = (values: KebabValues) => ({ ...channelNames(values.channelName, streamer), shop: values.channelName });
