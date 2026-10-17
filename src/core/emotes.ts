// Emotes from 7TV, BetterTTV and FrankerFaceZ (global and for the channel). All APIs are public,
// no token needed. Result: emote name -> image URL. Channel emotes override global ones,
// with the same name 7TV wins over BTTV over FFZ (like the browser extensions).

type SevenTvEmote = { name: string; data: { host: { url: string } } };
type BttvEmote = { id: string; code: string };
type FfzEmote = { code: string; images: Record<string, string | null> };
type SevenTvSet = { emotes?: SevenTvEmote[] };
type SevenTvUser = { emote_set?: SevenTvSet };
type BttvUser = { sharedEmotes?: BttvEmote[]; channelEmotes?: BttvEmote[] };
type EmoteEntry = readonly [string, string];

// Answers of foreign APIs: only the fields that are read here (rule 15)
async function json<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as T;
}

const seventv = (list: SevenTvEmote[] = []): EmoteEntry[] => list.map(emote => [emote.name, `https:${emote.data.host.url}/2x.webp`] as const);
const bttv = (list: BttvEmote[] = []): EmoteEntry[] => list.map(emote => [emote.code, `https://cdn.betterttv.net/emote/${emote.id}/2x`] as const);
const ffz = (list: FfzEmote[] = []): EmoteEntry[] => list.map(emote => [emote.code, emote.images["2x"] ?? emote.images["1x"] ?? ""] as const);

export async function loadEmotes(roomId: string): Promise<Map<string, string>> {
  // Order = priority ascending: later entries override earlier ones
  const sources: Promise<EmoteEntry[]>[] = [
    json<FfzEmote[]>("https://api.betterttv.net/3/cached/frankerfacez/emotes/global").then(ffz),
    json<BttvEmote[]>("https://api.betterttv.net/3/cached/emotes/global").then(bttv),
    json<SevenTvSet>("https://7tv.io/v3/emote-sets/global").then(set => seventv(set.emotes)),
    json<FfzEmote[]>(`https://api.betterttv.net/3/cached/frankerfacez/users/twitch/${roomId}`).then(ffz),
    json<BttvUser>(`https://api.betterttv.net/3/cached/users/twitch/${roomId}`).then(user => [...bttv(user.sharedEmotes), ...bttv(user.channelEmotes)]),
    json<SevenTvUser>(`https://7tv.io/v3/users/twitch/${roomId}`).then(user => seventv(user.emote_set?.emotes)),
  ];
  // One service down or the channel not registered there (404): the others run anyway
  const results = await Promise.allSettled(sources);
  const map = new Map<string, string>();
  for (const result of results) {
    if (result.status === "fulfilled") for (const [name, url] of result.value) if (url) map.set(name, url);
  }
  return map;
}
