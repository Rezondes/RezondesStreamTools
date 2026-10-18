// Commands page (scene info, public under /s/<login>/): shared text fields that every theme with a commands page
// adds to its schema, and describeCommands, which builds sections from the commands list (commands.ts) and these
// texts. Every theme decides the look itself. Placeholders: {channel} in the intro, otherwise as given at the field.
// Pure; check: infoFields.check.ts.
import type { CommandItem, CommandList } from "./commands.ts";
import { text, textarea, type ValuesOf } from "./fields.ts";
import type { SettingField, SettingValues } from "./theme.ts";
import { fillTemplate } from "./template.ts";

export const INFO_GROUP = "Befehlsseite";

export const INFO_FIELDS = [
  text("infoTitle", "Titel", INFO_GROUP, "Chat-Befehle"),
  textarea("infoIntro", "Einleitung ({channel})", INFO_GROUP, "Das kannst du im Chat von {channel} tippen.", 500),
  text("infoEmpty", "Text, wenn es keine Befehle gibt", INFO_GROUP, "Gerade gibt es hier keine Befehle."),
  text("infoHelpHeading", "Überschrift: Hilfe", INFO_GROUP, "Hilfe"),
  text("infoMinimesHeading", "Überschrift: Minimes", INFO_GROUP, "Minimes"),
  text("infoTriggersHeading", "Überschrift: Trigger", INFO_GROUP, "Effekte"),
  text("infoHelpText", "Hilfe-Befehl: Erklärung", INFO_GROUP, "Zeigt die Befehle im Chat."),
  text("infoJoinText", "Minimes einklinken: Erklärung", INFO_GROUP, "Mit deiner Figur in die Szene einsteigen."),
  text("infoJoinColor", "Einklinken mit Farbe ({command})", INFO_GROUP, "Mit Farbe: {command} #ff00aa oder {command} 255 0 170"),
  text("infoJoinVariant", "Einklinken mit Typ ({command}, {example})", INFO_GROUP, "Mit Typ: {command} {example}"),
  text("infoLookColor", "Farbe ändern: Erklärung ({command})", INFO_GROUP, "Farbe deiner Figur ändern, z.B. {command} #00ffaa"),
  text("infoLookVariant", "Typ wählen: Erklärung ({command})", INFO_GROUP, "Typ deiner Figur wählen: {command} <Name>"),
  text("infoVariants", "Liste der Typen ({names})", INFO_GROUP, "Zur Wahl: {names}"),
  text("infoLeaveText", "Verlassen: Erklärung", INFO_GROUP, "Deine Figur verlässt die Szene."),
  text("infoKick", "Rauswerfen ({roles}, {command})", INFO_GROUP, "{roles}: {command} @name wirft eine Figur raus."),
  text("infoWhenCommand", "Trigger als Befehl ({match})", INFO_GROUP, "Tippe {match}"),
  text("infoWhenWord", "Trigger als Wort ({match})", INFO_GROUP, "Schreib das Wort {match}"),
  text("infoWhenExact", "Trigger als ganze Nachricht ({match})", INFO_GROUP, "Schreib genau {match}"),
  text("infoWhenContains", "Trigger als Textteil ({match})", INFO_GROUP, "Schreib etwas mit {match}"),
  text("infoWhenRegex", "Trigger mit Muster", INFO_GROUP, "Eine besondere Nachricht"),
  text("infoWho", "Wer darf ({roles})", INFO_GROUP, "Für: {roles}"),
  text("infoRoleEveryone", "Rolle: alle", INFO_GROUP, "alle"),
  text("infoRoleSubscriber", "Rolle: Subs", INFO_GROUP, "Subs"),
  text("infoRoleVip", "Rolle: VIPs", INFO_GROUP, "VIPs"),
  text("infoRoleModerator", "Rolle: Mods", INFO_GROUP, "Mods"),
  text("infoRoleBroadcaster", "Rolle: Streamer", INFO_GROUP, "Streamer"),
  text("infoCooldown", "Abklingzeit für alle ({seconds})", INFO_GROUP, "Pause danach: {seconds} s"),
  text("infoUserCooldown", "Abklingzeit pro Person ({seconds})", INFO_GROUP, "Pro Person: {seconds} s"),
] as const satisfies readonly SettingField[];

export type InfoValues = ValuesOf<typeof INFO_FIELDS>;

// command: what one types ("" for patterns), text: explanation, details: short extra lines (who, how often, choice)
type InfoEntry = { command: string; text: string; details: string[] };
type InfoSection = { id: "help" | "minimes" | "triggers"; heading: string; entries: InfoEntry[] };

const ROLE_KEYS = {
  everyone: "infoRoleEveryone", subscriber: "infoRoleSubscriber", vip: "infoRoleVip", moderator: "infoRoleModerator", broadcaster: "infoRoleBroadcaster",
} as const;
const WHEN_KEYS = { command: "infoWhenCommand", word: "infoWhenWord", exact: "infoWhenExact", contains: "infoWhenContains", regex: "infoWhenRegex" } as const;

// Sections in a fixed order; empty ones drop out. values: resolved values of a theme with INFO_FIELDS
export function describeCommands(list: CommandList, stored: SettingValues): InfoSection[] {
  const values = stored as unknown as InfoValues;
  const of = (kinds: CommandItem["kind"][]) => list.items.filter(item => kinds.includes(item.kind)).map(item => describe(item, values));
  const sections: InfoSection[] = [
    { id: "help", heading: values.infoHelpHeading, entries: of(["help"]) },
    { id: "minimes", heading: values.infoMinimesHeading, entries: of(["join", "look", "team", "leave"]) },
    { id: "triggers", heading: values.infoTriggersHeading, entries: of(["trigger"]) },
  ];
  return sections.filter(section => section.entries.length > 0);
}

// Roles as text: "alle" (everyone) includes the rest, the streamer is only named when alone
function roles(who: readonly string[], values: InfoValues) {
  if (who.includes("everyone")) return values.infoRoleEveryone;
  const named = who.length > 1 ? who.filter(role => role !== "broadcaster") : who;
  return named.map(role => (role in ROLE_KEYS ? values[ROLE_KEYS[role as keyof typeof ROLE_KEYS]] : role)).join(", ");
}

function cooldowns(cooldown: number, userCooldown: number, values: InfoValues) {
  return [
    ...(cooldown > 0 ? [fillTemplate(values.infoCooldown, { seconds: cooldown })] : []),
    ...(userCooldown > 0 ? [fillTemplate(values.infoUserCooldown, { seconds: userCooldown })] : []),
  ];
}

function describe(item: CommandItem, values: InfoValues): InfoEntry {
  const who = (list: readonly string[]) => fillTemplate(values.infoWho, { roles: roles(list, values) });
  switch (item.kind) {
    case "help": return { command: item.command, text: values.infoHelpText, details: cooldowns(item.cooldown, 0, values) };
    case "join": {
      const hint = item.variants
        ? fillTemplate(values.infoJoinVariant, { command: item.command, example: item.variants[0]?.names[0] ?? "" })
        : fillTemplate(values.infoJoinColor, { command: item.command });
      return { command: item.command, text: values.infoJoinText, details: [who(item.who), hint] };
    }
    case "look": {
      if (!item.variants) return { command: item.command, text: fillTemplate(values.infoLookColor, { command: item.command }), details: [who(item.who)] };
      // The first name per variant; further names (other languages, spellings) are understood by chat too, they only bloat the list
      const names = item.variants.map(variant => variant.names[0]).join(", ");
      return { command: item.command, text: fillTemplate(values.infoLookVariant, { command: item.command }), details: [who(item.who), fillTemplate(values.infoVariants, { names })] };
    }
    case "team": {
      // The texts come with the faction fields (minimeTeamFields), only themes with factions have them
      const texts = values as unknown as { infoTeamText: string; infoTeams: string };
      const names = item.teams.map(team => team.names[0]).join(", ");
      return { command: item.command, text: fillTemplate(texts.infoTeamText, { command: item.command }), details: [who(item.who), fillTemplate(texts.infoTeams, { names })] };
    }
    case "leave": return { command: item.command, text: values.infoLeaveText, details: [fillTemplate(values.infoKick, { roles: roles(item.kickWho, values), command: item.command })] };
    case "trigger": {
      const how = fillTemplate(values[WHEN_KEYS[item.when]], { match: item.match ?? "" });
      return { command: item.match ?? "", text: item.description, details: [how, who(item.who), ...cooldowns(item.cooldown, item.userCooldown, values)] };
    }
  }
}
