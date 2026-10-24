// OBS sources of the koth theme (ThemeModule.areas): style "marke" hangs the dog tag beside the radio (alertLayout in
// dogtag.ts), the other styles show a card; both with room for their motion and the smoke. The music player as high as
// its cover or its text. Chat and camera fill their source and keep the default size. The stats report at the top left
// of its source with the stamp below it.
import { alertArea, musicArea } from "../../core/sceneArea.ts";
import { parseStatLines } from "../../core/stats/stats.ts";
import type { SceneArea, SceneName, SettingValues } from "../../core/theme.ts";
import { ALERT_TOP, alertLayout, DOGTAG } from "./dogtag.ts";
import type { KothValues } from "./settings.ts";

// fixed: the tallest radio and the tallest card before scaling (px): the radio as measured with the longest name, a line
// and a message of three lines, plus one more line; room for the swinging tag and its smoke, and around the card
const RADIO_HEIGHT = 340;
const CARD_HEIGHT = 300;
const ROOM = { tag: 80, card: 24 };
// fixed: the stats report: width with the room for its slide and shadow, its height without lines, one line, room for
// the stamp below it (px)
const STATS = { width: 600, base: 140, line: 42, stamp: 100 };
// fixed: the music player as measured in the browser with its padding per style (px): around the cover, around the
// text beside the title, the line height of the title, the album line
const MUSIC = { cover: { funkgeraet: 94, kiste: 100, schlicht: 86 }, text: { funkgeraet: 181, kiste: 171, schlicht: 157 }, titleLine: 1.3, album: 33 } as const;

export function kothAreas(values: SettingValues): Partial<Record<SceneName, SceneArea>> {
  const koth = values as unknown as KothValues;
  const { alertWidth: width, alertScale: scale } = koth;
  const top = ALERT_TOP;
  const stats = { width: STATS.width, height: STATS.base + parseStatLines(koth.reportLines.join("\n")).length * STATS.line + STATS.stamp };
  if (koth.alertStyle !== "marke") return { alerts: alertArea({ top, width, height: CARD_HEIGHT, scale, room: ROOM.card, centerOrigin: true }), stats, music: musicOf(koth) };
  const { tag, radio } = alertLayout("center", top, width, scale);
  const left = tag.x - (DOGTAG.width / 2) * scale - ROOM.tag;
  const right = radio.left + width * scale + ROOM.card;
  const bottom = Math.max(tag.y + (DOGTAG.height / 2) * scale + ROOM.tag, top + RADIO_HEIGHT * scale + ROOM.card);
  // The pair as one card from the left edge of the tag; it already sits where alertLayout put it
  return { alerts: alertArea({ align: "left", side: left, top: top - ROOM.card, width: right - left, height: bottom - top + ROOM.card, room: 0 }), stats, music: musicOf(koth) };
}

// The music player: as high as its cover or its text, whichever is taller
function musicOf({ musicStyle, coverSize, musicTitleSize, musicAlbum }: KothValues) {
  const style = musicStyle as keyof typeof MUSIC.cover;
  return musicArea(coverSize + MUSIC.cover[style], musicTitleSize * MUSIC.titleLine + MUSIC.text[style] + (musicAlbum ? MUSIC.album : 0));
}
