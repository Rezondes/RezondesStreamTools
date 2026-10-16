// Hilfe-Befehl im Chat (z.B. !befehle): antwortet als Streamer mit der Liste der Befehle und dem Link zur
// Befehlsseite. Abklingzeit gilt für alle. canChat: darf der Twitch-Login schreiben (null = noch unbekannt);
// false heisst, der Streamer muss Twitch neu verbinden. Gestartet von streamer.ts, Check: help.check.ts.
import { helpReply, type CommandList, type HelpConfig } from "../src/core/commands.ts";
import type { ChatLine } from "./chat.ts";

export type HelpSetup = {
  login: string; // der Streamer, als der geantwortet wird
  help: HelpConfig;
  link: string; // Adresse der Befehlsseite
  now: () => number;
  commands: () => Promise<CommandList>; // aktuelle Liste (Theme, Trigger und Einstellungen können sich ändern)
  say: (message: string) => Promise<"ok" | "missing-scope">;
};

export function startHelp(setup: HelpSetup) {
  let help = setup.help;
  let lastReply = -Infinity;
  let canChat: boolean | null = null;
  let lastSent = "";
  return {
    // Die eigene Antwort, wie sie im Chat zurückkommt; Trigger und Minimes sollen sie nicht sehen
    isEcho: (line: ChatLine) => line.login === setup.login && line.text === lastSent,
    setConfig: (next: HelpConfig) => { help = next; },
    canChat: () => canChat,
    setCanChat: (value: boolean | null) => { canChat = value; },
    async handle(line: ChatLine) {
      const first = line.text.trim().split(/\s+/)[0].toLowerCase();
      if (!help.enabled || first !== help.command) return;
      const now = setup.now();
      if (now - lastReply < help.cooldown * 1000) return;
      lastReply = now;
      lastSent = helpReply(help.reply, await setup.commands(), setup.link);
      const result = await setup.say(lastSent);
      canChat = result === "ok";
    },
  };
}
export type HelpRuntime = ReturnType<typeof startHelp>;
