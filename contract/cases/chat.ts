// Contract cases: the server reads the chat of every streamer with Twitch tokens anonymously.
import { fail, STREAMER, type Case } from "../client.ts";

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
];
