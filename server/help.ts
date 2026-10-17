// Help command in chat (e.g. !befehle): replies as the streamer with the list of commands and the link to the
// commands page. The cooldown applies to everyone. canChat: may the Twitch login write (null = not known yet);
// false means the streamer has to reconnect Twitch. Started by streamer.ts, check: help.check.ts.
import { helpReply, type CommandList, type HelpConfig } from "../src/core/commands.ts";
import type { ChatLine } from "./chat.ts";

type HelpSetup = {
  login: string; // the streamer the reply is sent as
  help: HelpConfig;
  link: string; // URL of the commands page
  now: () => number;
  commands: () => Promise<CommandList>; // current list (theme, triggers and settings can change)
  say: (message: string) => Promise<"ok" | "missing-scope">;
};

export function startHelp(setup: HelpSetup) {
  let help = setup.help;
  let lastReply = -Infinity;
  let canChat: boolean | null = null;
  let lastSent = "";
  return {
    // Our own reply as it comes back in chat; triggers and minimes must not see it
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
