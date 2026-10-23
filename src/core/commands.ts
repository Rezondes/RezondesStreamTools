// Overview of a streamer's chat commands, for the public commands page and the reply to the help command:
// the help command itself, the commands of the minimes (depending on the theme colors or variants, with the roles from the
// settings) and the active, public triggers. Data only, every page builds the visible texts itself.
// Pure (rule 12); used by the server, check: commands.check.ts.
import type { MinimeRules, MinimeVariantRule } from "./minimes.ts";

// Help command of the streamer (commands.json in the profile). reply: template of the chat reply with {commands} and {link}
export type HelpConfig = { enabled: boolean; command: string; reply: string; cooldown: number };

// The fields of a trigger (src/generated/Trigger.ts) that the overview reads. public: false = do not show
export type TriggerInfo = {
  name: string;
  enabled?: boolean;
  public?: boolean;
  description?: string;
  when: { type: "word" | "contains" | "exact" | "command" | "regex"; match: string };
  who?: string[];
  cooldown?: number;
  userCooldown?: number;
};

// variants: allowed variants with their names in chat, null = the theme uses colors. match null: regex (only the
// description is readable for humans)
export type CommandItem =
  | { kind: "help"; command: string; cooldown: number }
  | { kind: "join" | "look"; command: string; who: readonly string[]; variants: readonly MinimeVariantRule[] | null }
  | { kind: "leave"; command: string; kickWho: readonly string[] }
  | { kind: "team"; command: string; who: readonly string[]; teams: readonly MinimeVariantRule[] }
  | { kind: "trigger"; name: string; when: TriggerInfo["when"]["type"]; match: string | null; description: string; who: readonly string[]; cooldown: number; userCooldown: number };

export type CommandList = { channel: string; items: CommandItem[] };

// help null or off, minimes null (feature off or theme without minimes): these parts are missing
export function commandList(channel: string, help: HelpConfig | null, minimes: MinimeRules | null, triggers: readonly TriggerInfo[]): CommandList {
  return {
    channel,
    items: [
      ...(help?.enabled ? [{ kind: "help" as const, command: help.command, cooldown: help.cooldown }] : []),
      ...(minimes ? minimeItems(minimes) : []),
      ...triggers.filter(trigger => trigger.enabled !== false && trigger.public !== false).map(triggerItem),
    ],
  };
}

// The factions come before leave, like on the server
function minimeItems(rules: MinimeRules): CommandItem[] {
  const team = rules.commands.team && rules.teams ? [{ kind: "team" as const, command: rules.commands.team, who: rules.joinRoles, teams: rules.teams }] : [];
  return [
    { kind: "join", command: rules.commands.join, who: rules.joinRoles, variants: rules.variants },
    { kind: "look", command: rules.commands.look, who: rules.joinRoles, variants: rules.variants },
    ...team,
    { kind: "leave", command: rules.commands.leave, kickWho: rules.kickRoles },
  ];
}

function triggerItem(trigger: TriggerInfo): CommandItem {
  return {
    kind: "trigger",
    name: trigger.name,
    when: trigger.when.type,
    match: trigger.when.type === "regex" ? null : trigger.when.match,
    description: trigger.description ?? "",
    who: trigger.who ?? ["everyone"],
    cooldown: trigger.cooldown ?? 0,
    userCooldown: trigger.userCooldown ?? 0,
  };
}
