// Contract cases: EventSub of a streamer with Twitch tokens; subscriptions after the welcome, notifications as alerts.
import { fail, request, STREAMER, type Case, type Context } from "../client.ts";
import { readStream } from "./overlay.ts";

type Subscription = { type?: string; condition?: Record<string, string>; transport?: { method?: string; session_id?: string } };

const ofStreamer = (context: Context) =>
  (context.fake.subscriptions as Subscription[]).filter(entry => Object.values(entry.condition ?? {}).includes(STREAMER.id));

export const ALERT_CASES: Case[] = [
  {
    name: "eventsub: after the welcome every subscription is requested for the session",
    async run(context) {
      for (let tries = 0; tries < 50 && ofStreamer(context).length < 10; tries++) await new Promise(resolve => setTimeout(resolve, 100));
      const subscriptions = ofStreamer(context);
      if (subscriptions.length < 10) fail(`only ${subscriptions.length} subscriptions for ${STREAMER.login}`);
      if (!subscriptions.some(entry => entry.type === "channel.follow")) fail("no channel.follow");
      if (!subscriptions.every(entry => entry.transport?.method === "websocket" && entry.transport.session_id)) fail("transport without session");
    },
  },
  {
    name: "eventsub: a notification reaches the overlays as an alert",
    async run(context) {
      const key = context.memory.get("overlayKey") ?? fail("no overlay key from an earlier case");
      const stream = await request(context, `/s/${STREAMER.login}/events?key=${key}`);
      await readStream(stream, "contract-follower", async () => {
        const notification = {
          metadata: { message_type: "notification", subscription_type: "channel.follow" },
          payload: { event: { user_name: "contract-follower", broadcaster_user_id: STREAMER.id } },
        };
        const sent = await fetch(`${context.fake.url}/control/eventsub`, { method: "POST", body: JSON.stringify(notification) });
        if (sent.status !== 204) fail(`fake control answered ${sent.status}`);
      });
    },
  },
];
