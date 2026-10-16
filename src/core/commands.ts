// Übersicht der Chat-Befehle eines Streamers, für die öffentliche Befehlsseite und die Antwort auf den Hilfe-Befehl:
// der Hilfe-Befehl selbst, die Befehle der Minimes (je nach Theme Farben oder Typen, mit den Rollen aus den
// Einstellungen) und die aktiven, öffentlichen Trigger. Nur Daten, die sichtbaren Texte macht jede Seite selbst.
// Rein (Regel 12); genutzt vom Server, Check: commands.check.ts.
import type { MinimeRules, MinimeVariantRule } from "./minimes.ts";

// Hilfe-Befehl des Streamers (commands.json im Profil). reply: Vorlage der Chat-Antwort mit {commands} und {link}
export type HelpConfig = { enabled: boolean; command: string; reply: string; cooldown: number };

// Die Felder eines Triggers (server/triggers.ts), die die Übersicht liest. public: false = nicht zeigen
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

// variants: erlaubte Typen mit ihren Namen im Chat, null = das Theme nutzt Farben. match null: Regex (nur die
// Beschreibung ist für Menschen lesbar)
export type CommandItem =
  | { kind: "help"; command: string; cooldown: number }
  | { kind: "join" | "look"; command: string; who: readonly string[]; variants: readonly MinimeVariantRule[] | null }
  | { kind: "leave"; command: string; kickWho: readonly string[] }
  | { kind: "trigger"; name: string; when: TriggerInfo["when"]["type"]; match: string | null; description: string; who: readonly string[]; cooldown: number; userCooldown: number };

export type CommandList = { channel: string; items: CommandItem[] };

// help null oder aus, minimes null (Funktion aus oder Theme ohne Minimes): diese Teile fehlen
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

function minimeItems(rules: MinimeRules): CommandItem[] {
  return [
    { kind: "join", command: rules.commands.join, who: rules.joinRoles, variants: rules.variants },
    { kind: "look", command: rules.commands.look, who: rules.joinRoles, variants: rules.variants },
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
