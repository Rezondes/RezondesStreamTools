// Help command of a streamer (commands.json in the profile folder): on/off, command, template of the chat reply and
// cooldown. Validate (for the dashboard), load (with defaults) and save atomically; plus the public list of all
// chat commands (/s/<login>/commands). Check: commands.check.ts.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { commandList, type CommandList, type HelpConfig, type TriggerInfo } from "../src/core/commands.ts";
import { writeAtomic } from "./atomicFile.ts";
import { loadSettings, minimeRules } from "./settings.ts";

export const DEFAULT_HELP: HelpConfig = { enabled: true, command: "!befehle", reply: "Befehle: {commands} | Alles erklärt: {link}", cooldown: 30 };

const COMMAND = /^![a-z0-9_]{1,24}$/;
const MAX_REPLY = 400;
const MAX_COOLDOWN = 3600;

// Valid setting or null; the command is case-insensitive
export function toHelpConfig(value: unknown): HelpConfig | null {
  if (typeof value !== "object" || value === null) return null;
  const { enabled, command, reply, cooldown } = value as Record<string, unknown>;
  if (typeof enabled !== "boolean" || typeof command !== "string" || typeof reply !== "string" || typeof cooldown !== "number") return null;
  const lower = command.toLowerCase();
  if (!COMMAND.test(lower) || reply.length > MAX_REPLY || !Number.isInteger(cooldown) || cooldown < 0 || cooldown > MAX_COOLDOWN) return null;
  return { enabled, command: lower, reply, cooldown };
}

const file = (folder: string) => join(folder, "commands.json");

// Missing or invalid file: the default applies
export async function loadHelp(folder: string): Promise<HelpConfig> {
  try {
    return toHelpConfig(JSON.parse(await readFile(file(folder), "utf8"))) ?? DEFAULT_HELP;
  } catch {
    // Missing or not JSON
    return DEFAULT_HELP;
  }
}

export const saveHelp = (folder: string, help: HelpConfig) => writeAtomic(file(folder), JSON.stringify(help, null, 2) + "\n");

// Triggers as stored in triggers.json; missing or broken file: none
async function loadTriggerInfo(folder: string): Promise<TriggerInfo[]> {
  try {
    const parsed = JSON.parse(await readFile(join(folder, "triggers.json"), "utf8")) as { triggers?: unknown };
    return Array.isArray(parsed.triggers) ? (parsed.triggers as TriggerInfo[]).filter(trigger => typeof trigger?.when?.match === "string") : [];
  } catch {
    // Missing or not JSON
    return [];
  }
}

// All chat commands of a streamer; only the parts whose features are on for them (triggers need triggers and fx)
export async function publicCommands(folder: string, login: string, features: Record<string, boolean>): Promise<CommandList> {
  const minimes = features.minimes ? minimeRules(await loadSettings(folder)) : null;
  const triggers = features.triggers && features.fx ? await loadTriggerInfo(folder) : [];
  return commandList(login, await loadHelp(folder), minimes, triggers);
}
