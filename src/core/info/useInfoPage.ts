// Hook of the commands page (scene info): list of chat commands (useCommands) as sections with the texts of the theme
// (describeCommands, INFO_FIELDS) and the intro with {channel} and {login}. null until the list is loaded.
// demoMinimes: minime rules of the theme for the demo list, null = theme without minimes.
import { useCommands } from "../hooks/useCommands.ts";
import { describeCommands, type InfoValues } from "../infoFields.ts";
import type { MinimeRules } from "../minimes.ts";
import type { SettingValues } from "../theme.ts";
import { fillTemplate } from "../template.ts";

export function useInfoPage(values: SettingValues, names: Record<string, string>, demoMinimes: MinimeRules | null) {
  const list = useCommands(demoMinimes);
  if (!list) return null;
  const texts = values as unknown as InfoValues;
  return { title: texts.infoTitle, intro: fillTemplate(texts.infoIntro, names), empty: texts.infoEmpty, sections: describeCommands(list, values) };
}
