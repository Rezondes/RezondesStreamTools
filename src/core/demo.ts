// Fake-Ereignisse für ?demo: Chat, Alerts, Musik und Minimes, damit sich jedes Overlay ohne Stream testen lässt.
// ?demo=<n>: so viele Minimes (Standard 5, höchstens 100).
import { splitEmotes } from "./irc.ts";
import { numberParam } from "./params.ts";
import type { Alert, Minime, Track } from "./types.ts";
import type { Handlers } from "./connection.ts";

const NAMES = ["neo_42", "Trinity", "MorpheusTV", "agent_smith", "Oracle", "Tank", "Dozer", "Switch"];
const LINES = [
  "hallo zusammen!", "was programmierst du heute?", "LUL", "der matrix style ist krass",
  "C# > alles", "kannst du das nochmal erklären?", "gg", "follow ist raus <3",
  "wie lange streamst du heute noch?", "Kappa", "das ist ein etwas längerer Text, damit man sieht wie der Umbruch aussieht",
];
// 25 = Kappa, 425618 = LUL (öffentliche Twitch-Emotes)
const EMOTE_IDS: Record<string, number> = { Kappa: 25, LUL: 425618 };
// Selbst gezeichnetes Demo-Cover (Verlauf mit Kreisen und Schrift), damit ?art=cover|record ohne Spotify testbar ist
const DEMO_COVER = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#222"/></linearGradient></defs>'
  + '<rect width="100" height="100" fill="url(#g)"/><circle cx="30" cy="35" r="18" fill="#000"/><circle cx="68" cy="62" r="24" fill="none" stroke="#000" stroke-width="5"/>'
  + '<text x="8" y="92" font-family="monospace" font-size="13" fill="#000">DEMO</text></svg>',
);
const SAMPLES: Alert[] = [
  { kind: "follow", user: "neo_42" },
  { kind: "sub", user: "Trinity", text: "Endlich abonniert!" },
  { kind: "resub", user: "MorpheusTV", amount: 12, text: "Ein Jahr schon!" },
  { kind: "gift", user: "Oracle", amount: 5 },
  { kind: "raid", user: "agent_smith", amount: 42 },
  { kind: "cheer", user: "Tank", amount: 500, text: "Nimm das!" },
  { kind: "redeem", user: "Dozer", amount: 500, detail: "Hydrieren!", text: "Trink was!" },
  { kind: "hype", user: "HYPE TRAIN", amount: 1, detail: "begin" },
];
const TRACKS: Track[] = [
  { id: "1", title: "Wake Up", artist: "Rage Against the Machine", album: "The Matrix (Music from the Motion Picture)", cover: null, durationMs: 364000, progressMs: 40000, playing: true },
  { id: "2", title: "Clubbed to Death (Kurayamino Variation)", artist: "Rob Dougan", album: "The Matrix (Music from the Motion Picture)", cover: DEMO_COVER, durationMs: 451000, progressMs: 0, playing: true },
];

const pick = <T,>(list: T[]) => list[(Math.random() * list.length) | 0];

// Demo-Minimes mit verschiedenen Farben, null = Standardfarbe des Themes
const MINIME_COLORS = ["#39ff14", "#00e5ff", "#ff2bd6", "#ffd400", "#ff6a00", null];
function demoMinimes(): Minime[] {
  const count = Math.min(100, Math.max(0, numberParam("demo", 5) || 5));
  return Array.from({ length: count }, (_, index) => {
    const user = `${NAMES[index % NAMES.length]}${index >= NAMES.length ? index : ""}`;
    return { login: user.toLowerCase(), user, color: MINIME_COLORS[index % MINIME_COLORS.length] };
  });
}

// Startet die Fake-Ereignisse; die Rückgabe stoppt sie
export function demo(handlers: Handlers) {
  const chat = setInterval(() => {
    const user = pick(NAMES);
    const text = pick(LINES);
    const emoteId = EMOTE_IDS[text];
    handlers.chat?.({
      id: crypto.randomUUID(),
      login: user.toLowerCase(),
      user,
      badges: Math.random() < 0.3 ? [pick(["MOD", "VIP", "SUB"])] : [],
      parts: emoteId ? splitEmotes(text, `${emoteId}:0-${text.length - 1}`) : [text],
      action: false,
    });
  }, 2200);

  let trackIndex = 0;
  handlers.music?.(TRACKS[0]);
  const music = setInterval(() => handlers.music?.(TRACKS[++trackIndex % TRACKS.length]), 15000);

  let alertIndex = 0;
  const fire = () => handlers.alert?.(SAMPLES[alertIndex++ % SAMPLES.length]);
  const first = setTimeout(fire, 1000);
  const alerts = setInterval(fire, 11000);
  const minimes = demoMinimes();
  handlers.minimes?.(minimes);
  const minimeChat = setInterval(() => handlers.minimeChat?.(pick(minimes).login), 3000);
  return () => { clearInterval(chat); clearInterval(alerts); clearInterval(music); clearInterval(minimeChat); clearTimeout(first); };
}
