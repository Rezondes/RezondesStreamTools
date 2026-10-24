// Values of the Dogs theme in a scene: the resolved settings from the context (set in main.tsx) with their type from
// settings.ts, plus the placeholders {channel}, {login} (channelNames) and {dog} (the name of the streamer's dog).
import { streamer } from "../../core/connection.ts";
import { useThemeValues } from "../../core/hooks/useSettings.ts";
import { channelNames } from "../../core/template.ts";
import type { DogsValues } from "./settings.ts";

export const useDogs = () => useThemeValues() as unknown as DogsValues;

export const dogsNames = (values: DogsValues) => ({ ...channelNames(values.channelName, streamer), dog: values.dogName });
