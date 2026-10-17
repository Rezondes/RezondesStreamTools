// Contract cases: the server reads the chat of every streamer with Twitch tokens anonymously and sends chat lines and
// moderation to the overlays.
import { fail, request, STREAMER, type Case } from "../client.ts";
import { readStream } from "./overlay.ts";

export const CHAT_CASES: Case[] = [
  {
    name: "chat: the server joins the chat of the streamer anonymously",
    async run(context) {
      const joined = () => context.fake.ircReceived.includes(`JOIN #${STREAMER.login}`);
      for (let tries = 0; tries < 50 && !joined(); tries++) await new Promise((resolve) => setTimeout(resolve, 100));
      if (!joined()) fail(`no JOIN #${STREAMER.login}: ${context.fake.ircReceived.join(" | ")}`);
      if (!context.fake.ircReceived.some((line) => line.startsWith("NICK justinfan"))) fail("login is not anonymous");
    },
  },
  {
    name: "chat: chat lines and bans reach the overlays as events",
    async run(context) {
      const key = context.memory.get("overlayKey") ?? fail("no overlay key from an earlier case");
      const irc = (line: string) => fetch(`${context.fake.url}/control/irc`, { method: "POST", body: line });
      const said = `:trinity!trinity@trinity.tmi.twitch.tv PRIVMSG #${STREAMER.login} :follow the white rabbit`;
      await readStream(await request(context, `/s/${STREAMER.login}/events?key=${key}`), "white rabbit", async () => { await irc(said); });
      await readStream(await request(context, `/s/${STREAMER.login}/events?key=${key}`), '"type":"remove"', async () => {
        await irc(`:tmi.twitch.tv CLEARCHAT #${STREAMER.login} :trinity`);
      });
    },
  },
];
