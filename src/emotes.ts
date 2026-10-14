// Emotes von 7TV, BetterTTV und FrankerFaceZ (global und für den Kanal). Alle APIs sind öffentlich,
// kein Token nötig. Ergebnis: Emote-Name -> Bild-URL. Kanal-Emotes überschreiben globale,
// bei gleichem Namen gewinnt 7TV vor BTTV vor FFZ (so wie die Browser-Erweiterungen).

type SevenTvEmote = { name: string; data: { host: { url: string } } };
type BttvEmote = { id: string; code: string };
type FfzEmote = { code: string; images: Record<string, string | null> };

const json = (url: string) => fetch(url).then(r => (r.ok ? r.json() : Promise.reject(r.status)));

const seventv = (list: SevenTvEmote[] = []) => list.map(e => [e.name, `https:${e.data.host.url}/2x.webp`] as const);
const bttv = (list: BttvEmote[] = []) => list.map(e => [e.code, `https://cdn.betterttv.net/emote/${e.id}/2x`] as const);
const ffz = (list: FfzEmote[] = []) => list.map(e => [e.code, e.images["2x"] ?? e.images["1x"] ?? ""] as const);

export async function loadEmotes(roomId: string): Promise<Map<string, string>> {
  // Reihenfolge = Priorität aufsteigend: spätere Einträge überschreiben frühere
  const sources = [
    json("https://api.betterttv.net/3/cached/frankerfacez/emotes/global").then(ffz),
    json("https://api.betterttv.net/3/cached/emotes/global").then(bttv),
    json("https://7tv.io/v3/emote-sets/global").then(d => seventv(d.emotes)),
    json(`https://api.betterttv.net/3/cached/frankerfacez/users/twitch/${roomId}`).then(ffz),
    json(`https://api.betterttv.net/3/cached/users/twitch/${roomId}`).then(d => [...bttv(d.sharedEmotes), ...bttv(d.channelEmotes)]),
    json(`https://7tv.io/v3/users/twitch/${roomId}`).then(d => seventv(d.emote_set?.emotes)),
  ];
  // Ein Dienst down oder Kanal dort nicht registriert (404): die anderen laufen trotzdem
  const results = await Promise.allSettled(sources);
  const map = new Map<string, string>();
  for (const r of results) if (r.status === "fulfilled") for (const [name, url] of r.value) if (url) map.set(name, url);
  return map;
}
