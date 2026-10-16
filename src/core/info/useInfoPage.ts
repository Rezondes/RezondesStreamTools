// Hook der Befehlsseite (Szene info): Liste der Chat-Befehle (useCommands) als Abschnitte mit den Texten des Themes
// (describeCommands, INFO_FIELDS) und die Einleitung mit {channel} und {login}. null, bis die Liste geladen ist.
// demoMinimes: Regeln der Minimes des Themes für die Demo-Liste, null = Theme ohne Minimes.
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
