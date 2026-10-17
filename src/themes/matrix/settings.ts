// Settings schema of the built-in theme "matrix": every visible and audible value is a setting here,
// the defaults give the original look. The only place of the theme with fixed colors, texts and numbers.
// MatrixValues is the type of the resolved values that the scenes read via useMatrix (values.ts).
import { asciiText } from "../../core/asciiText.ts";
import { asciiArt, choice, color, flag, font, inScene, lines, number, text, type ValuesOf } from "../../core/fields.ts";
import { GLYPHS } from "../../core/glyphs.ts";
import { MINIME_COMMANDS, MINIME_FIELDS, MINIME_MOTION, MINIME_RULES } from "../../core/minimeFields.ts";
import { INFO_FIELDS, INFO_GROUP } from "../../core/infoFields.ts";
import { alertSoundFields } from "../../core/alerts/alerts.ts";
import { badgeFields } from "../../core/chat/chat.ts";
import type { SettingField, ThemeSchema } from "../../core/theme.ts";

// Sample logo; on first login personalize creates the logo from the Twitch login
const LOGO = asciiText("STREAM");

export const FONTS = ["Share Tech Mono", "VT323", "Fira Mono", "IBM Plex Mono", "Courier New"] as const;
const ANIMATIONS = ["glitch", "fade", "none"] as const;
const LOCALES = ["de-DE", "de-CH", "de-AT", "en-US", "en-GB", "fr-FR", "es-ES", "nl-NL"] as const;

const GENERAL = "Allgemein";
const RAIN = "Matrix-Regen";
const SCREENS = "Starting, BRB, Ending";
const ALERTS = "Alerts";
const CHAT = "Chat";
const CAM = "Kamera-Rahmen";
const MUSIC = "Musik";
const FX = "Effekte";
const STINGER = "Stinger";
const BANNER = "Banner";
const MINIME_LOOK = "Minimes: Aussehen";
const MINIME_MOVES = "Minimes: Animationen";

const FIELDS = [
  // Allgemein
  color("accent", "Hauptfarbe", GENERAL, "#39ff14"),
  color("dim", "Gedämpfte Farbe", GENERAL, "#1e9e0f"),
  color("line", "Linienfarbe", GENERAL, "#0e4d07"),
  color("background", "Hintergrund", GENERAL, "#000000"),
  color("glow", "Glühfarbe", GENERAL, "#39ff14"),
  color("highlight", "Glitch-Farbe", GENERAL, "#b6ff9e"),
  color("flash", "Blitzfarbe", GENERAL, "#d8ffcc"),
  font("font", "Schrift", GENERAL, "Share Tech Mono", FONTS),
  number("fontSize", "Grundgrösse der Schrift", GENERAL, 16, 8, 48, "px"),
  text("channelName", "Kanal-Name", GENERAL, "STREAM", 40),
  asciiArt("logo", "ASCII-Logo", GENERAL, LOGO),
  number("glowStrength", "Glühen (Stärke)", GENERAL, 1, 0, 3, undefined, 0.1),
  flag("scanlines", "Scanlines", GENERAL, true),
  number("scanlineStrength", "Scanlines (Stärke)", GENERAL, 0.28, 0, 1, undefined, 0.01),
  number("glitchStrength", "Glitch (Stärke)", GENERAL, 1, 0, 4, "px", 0.1),
  number("glitchInDuration", "Glitch rein (Dauer)", GENERAL, 500, 0, 3000, "ms"),
  number("glitchOutDuration", "Glitch raus (Dauer)", GENERAL, 450, 0, 3000, "ms"),
  number("glitchCycle", "Namens-Glitch alle", GENERAL, 3, 1, 30, "s"),
  number("decodeSpeed", "Entschlüsseln (Tempo)", GENERAL, 1, 0.1, 5, undefined, 0.1),
  text("cursor", "Cursor-Zeichen", GENERAL, "█", 4),
  choice("locale", "Uhrzeit-Format", GENERAL, "de-DE", LOCALES),

  // Matrix rain
  text("glyphs", "Zeichensatz (Regen, Entschlüsseln, Stinger)", RAIN, GLYPHS, 400),
  flag("rainScreens", "Regen in Starting/BRB/Ending", RAIN, true),
  flag("rainAlerts", "Regen in Alerts", RAIN, true),
  number("rainSizeScreens", "Zeichengrösse (Szenen)", RAIN, 20, 6, 80, "px"),
  number("rainSizeAlerts", "Zeichengrösse (Alerts)", RAIN, 14, 6, 80, "px"),
  number("rainDensity", "Dichte", RAIN, 100, 0, 100, "%"),
  number("rainSpeed", "Geschwindigkeit", RAIN, 1, 0.1, 5, undefined, 0.1),
  number("rainOpacityScreens", "Deckkraft (Szenen)", RAIN, 0.35, 0, 1, undefined, 0.01),
  number("rainOpacityAlerts", "Deckkraft (Alerts)", RAIN, 0.16, 0, 1, undefined, 0.01),
  number("rainFps", "Bildrate", RAIN, 20, 1, 60),

  // Starting, BRB, Ending
  inScene("starting", text("startingTitle", "Titel Starting", SCREENS, "STREAM STARTET GLEICH")),
  inScene("brb", text("brbTitle", "Titel BRB", SCREENS, "BIN GLEICH ZURÜCK")),
  inScene("ending", text("endingTitle", "Titel Ending", SCREENS, "STREAM BEENDET")),
  text("sceneHeader", "Kopfzeile ({channel}, {scene})", SCREENS, "{channel}://stream/{scene}"),
  text("liveText", "Live-Anzeige", SCREENS, "● LIVE-FEED"),
  flag("screenLogo", "Logo zeigen", SCREENS, true),
  inScene("starting", number("countdown", "Countdown-Standard", SCREENS, 300, 0, 86400, "s")),
  inScene("starting", text("countdownPrefix", "Countdown-Präfix", SCREENS, "T-")),
  inScene("starting", text("countdownDone", "Text nach dem Countdown", SCREENS, "INITIALISIERE ...")),
  inScene("starting", flag("progressBar", "Fortschrittsbalken", SCREENS, true)),
  inScene("starting", number("progressWidth", "Fortschrittsbalken (Zeichen)", SCREENS, 40, 5, 100)),
  inScene("starting", text("barFull", "Balken voll", SCREENS, "█", 4)),
  inScene("starting", text("barEmpty", "Balken leer", SCREENS, "░", 4)),
  inScene("brb", text("afkPrefix", "BRB-Zähler-Präfix", SCREENS, "AFK ")),
  inScene("brb", text("brbNote", "Untertitel BRB", SCREENS, "Chat bleibt offen, schreibt ruhig weiter.")),
  inScene("ending", text("endingThanks", "Untertitel Ending", SCREENS, "DANKE FÜRS ZUSCHAUEN")),
  inScene("ending", text("endingNextLabel", "Nächster Stream (Beschriftung)", SCREENS, "Nächster Stream: ")),
  inScene("ending", text("endingNext", "Nächster Stream (leer = ausblenden)", SCREENS, "")),
  flag("terminal", "Terminal", SCREENS, true),
  text("prompt", "Prompt ({login}, {channel})", SCREENS, "root@{login}:~$"),
  inScene("starting", lines("startingLines", "Terminal Starting ({del 3}, {pause 900}, {smash 10})", SCREENS, [
    "boot sequence initiated",
    "coffee.exe not found ... falling back to energy_drink.exe",
    "cracking open a cold one ... *psst*",
    "loading neural_net.dll ... ok",
    "compiling overlays ... succeeded (0 warnings, 47 suppressed)",
    "connecting to twitch.tv:443 ... ok",
    "sudo systemclt{del 2}tl strat{del 3}art stream{pause 900} --now{pause 600} --pls",
    "npm install motivation ... 1,284 vulnerabilities found",
    "calibrating webcam ... ok",
    "git blame overlay.tsx ... it was me",
    "estimating start time ... 5 min (programmer minutes)",
    "rubber duck debugging ... duck refuses to comment",
    "warming up keyboard ... ok",
    "git comit{del 4}ommit -m \"fxi{del 3}fix\"{pause 800}{del 4}final fix v2\"{pause 500} && git psuh{del 4}push",
    "fixing 1 bug ... 2 new bugs found",
    "scanning chat for the one ... searching",
    "it works on my machine ... shipping my machine to chat",
    "git pull origin main ... already up to date",
  ])),
  inScene("brb", lines("brbLines", "Terminal BRB", SCREENS, [
    "process suspended (pid 1337)",
    "user status: afk",
    "refilling drink ... cup 3 of ?",
    "ping streamer ... request timed out",
    "retrying in 5s ...",
    "sleep 300 # TODO: remove before stream",
    "echo \"bin gelich{del 5}lecih{del 3}ich zrü{del 3}{pause 600}zurkc{del 3}{pause 900}{smash 18}",
    "keeping chat warm ... ok",
    "rubber duck is now in charge of the stream",
    "garbage collector running ... streamer not collected",
    "streamer.exe is not responding ... [wait] [close]",
    "do not unplug the matrix",
    "while (afk) { chat.entertain(); }",
    "awaiting operator input",
  ])),
  inScene("ending", lines("endingLines", "Terminal Ending", SCREENS, [
    "saving session ... ok",
    "flushing chat buffer ... ok",
    "writing highlights to /dev/memory ... ok",
    "git commit -m \"stream done\" ... ok",
    "shutting down streamer ... streamer refuses",
    "thanks for watching",
    "closing 47 browser tabs ... 46 remaining",
    "shutdwon{del 4}down -h nwo{del 3}now{pause 900} --really{pause 700}{smash 10}",
    "stopping services ...",
    "connection closed by remote host",
    "see you in the matrix",
  ])),
  number("typingSpeed", "Tipp-Tempo", SCREENS, 1, 0.2, 5, undefined, 0.1),
  number("terminalStartDelay", "Terminal startet nach", SCREENS, 2600, 0, 30000, "ms"),
  number("terminalPauseMin", "Pause zwischen Zeilen (min)", SCREENS, 1800, 0, 60000, "ms"),
  number("terminalPauseMax", "Pause zwischen Zeilen (max)", SCREENS, 3200, 0, 60000, "ms"),
  number("terminalVisible", "Sichtbare Zeilen", SCREENS, 5, 1, 20),
  text("ticker", "Ticker-Text (leer = aus)", SCREENS, "", 500),
  text("tickerSeparator", "Ticker-Trenner", SCREENS, "   //   "),
  number("tickerSpeed", "Ticker-Durchlauf", SCREENS, 60, 5, 600, "s"),
  choice("powerOn", "Einschalt-Animation", SCREENS, "zoom", ["zoom", "fade", "none"]),
  number("powerOnDuration", "Einschalt-Animation (Dauer)", SCREENS, 1600, 0, 10000, "ms"),
  number("frameWidth", "Rahmen-Breite", SCREENS, 1400, 400, 1920, "px"),
  number("frameHeight", "Rahmen-Höhe", SCREENS, 820, 300, 1080, "px"),

  // Alerts: placeholders {user}, {amount}, {detail}, {text}
  text("alertHeader", "Kopfzeile ({tag})", ALERTS, "> INCOMING TRANSMISSION // {tag}"),
  text("tierSuffix", "Abo-Stufe an der Kopfzeile ({detail})", ALERTS, " // {detail}"),
  text("followTag", "Follow: Kopfzeile", ALERTS, "FOLLOW"),
  text("followLine", "Follow: Zeile", ALERTS, "ist jetzt in der Matrix."),
  text("subTag", "Sub: Kopfzeile", ALERTS, "SUB"),
  text("subLine", "Sub: Zeile", ALERTS, "hat die rote Pille genommen."),
  text("resubTag", "Resub: Kopfzeile", ALERTS, "RESUB x{amount}"),
  text("resubLine", "Resub: Zeile", ALERTS, "ist seit {amount} Monaten dabei."),
  text("giftTag", "Gift: Kopfzeile", ALERTS, "GIFT x{amount}"),
  text("giftLine", "Gift: Zeile (mehrere)", ALERTS, "verschenkt {amount} Subs an den Chat."),
  text("giftOneLine", "Gift: Zeile (einer)", ALERTS, "verschenkt einen Sub."),
  text("giftToLine", "Gift: Zeile (an jemanden, {text})", ALERTS, "verschenkt einen Sub an {text}."),
  text("raidTag", "Raid: Kopfzeile", ALERTS, "RAID"),
  text("raidLine", "Raid: Zeile", ALERTS, "raidet mit {amount} Zuschauern!"),
  text("cheerTag", "Bits: Kopfzeile", ALERTS, "{amount} BITS"),
  text("cheerLine", "Bits: Zeile", ALERTS, "cheert {amount} Bits."),
  text("redeemTag", "Kanalpunkte: Kopfzeile", ALERTS, "{amount} KANALPUNKTE"),
  text("redeemLine", "Kanalpunkte: Zeile", ALERTS, "löst \"{detail}\" ein."),
  text("hypeTag", "Hype Train: Kopfzeile", ALERTS, "HYPE TRAIN"),
  text("hypeTitle", "Hype Train: Name", ALERTS, "HYPE TRAIN"),
  text("hypeBeginLine", "Hype Train: Start", ALERTS, "ist abgefahren! Alle einsteigen."),
  text("hypeEndLine", "Hype Train: Ende", ALERTS, "ist auf Level {amount} angekommen. Danke!"),
  flag("alertQuote", "Nachricht zeigen", ALERTS, true),
  text("quoteFormat", "Nachricht ({text})", ALERTS, "\"{text}\""),
  number("alertDuration", "Dauer", ALERTS, 7000, 2000, 60000, "ms"),
  number("alertScale", "Grösse", ALERTS, 0.7, 0.2, 2, undefined, 0.05),
  number("alertTop", "Abstand oben", ALERTS, 64, 0, 1000, "px"),
  choice("alertAlign", "Position", ALERTS, "center", ["left", "center", "right"]),
  number("alertWidth", "Breite", ALERTS, 860, 300, 1900, "px"),
  choice("alertIn", "Einblenden", ALERTS, "glitch", ANIMATIONS),
  choice("alertOut", "Ausblenden", ALERTS, "glitch", ANIMATIONS),
  flag("alertTimer", "Restzeit-Balken", ALERTS, true),
  flag("alertSound", "Töne", ALERTS, true),
  ...alertSoundFields(ALERTS),

  // Chat
  text("chatPrompt", "Prompt hinter dem Namen", CHAT, "@twitch:~$"),
  ...badgeFields(CHAT),
  number("chatFontSize", "Schriftgrösse", CHAT, 22, 8, 80, "px"),
  number("chatFade", "Ausblenden nach (0 = nie)", CHAT, 30, 0, 3600, "s"),
  number("chatMax", "Max. Nachrichten", CHAT, 30, 1, 200),
  choice("chatAlign", "Ausrichtung", CHAT, "bottom", ["bottom", "top"]),
  number("chatOpacity", "Hintergrund-Deckkraft", CHAT, 0.75, 0, 1, undefined, 0.01),
  number("emoteSize", "Emote-Grösse", CHAT, 33, 8, 200, "px"),
  choice("chatIn", "Einblenden", CHAT, "glitch", ANIMATIONS),
  choice("chatOut", "Ausblenden", CHAT, "glitch", ANIMATIONS),

  // Camera frame
  text("camLabel", "Label ({channel})", CAM, "CAM_01 // {channel}"),
  flag("camRec", "REC-Anzeige", CAM, true),
  text("camRecDot", "REC-Punkt", CAM, "●", 4),
  text("camRecText", "REC-Text", CAM, "REC"),
  flag("camClock", "Uhr", CAM, true),
  number("cornerLength", "Eckenlänge", CAM, 36, 0, 400, "px"),
  number("cornerWidth", "Eckendicke", CAM, 4, 0, 40, "px"),

  // Musik
  choice("musicArt", "Darstellung", MUSIC, "cover", ["cover", "record", "vinyl", "none"]),
  text("musicHeadPlaying", "Kopfzeile bei Wiedergabe", MUSIC, "> NOW PLAYING // SPOTIFY"),
  text("musicHeadPaused", "Kopfzeile bei Pause", MUSIC, "> NOW PLAYING // PAUSE"),
  text("musicIdleTitle", "Titel ohne Wiedergabe", MUSIC, "KEINE WIEDERGABE"),
  text("musicIdleArtist", "Interpret ohne Wiedergabe", MUSIC, "spotify://offline"),
  flag("musicHide", "Bei Pause ausblenden", MUSIC, true),
  flag("equalizer", "Equalizer", MUSIC, true),
  number("equalizerBars", "Equalizer-Balken", MUSIC, 12, 1, 60),
  number("musicMarqueeSpeed", "Lange Zeilen: Lauftempo (px pro Sekunde)", MUSIC, 40, 5, 400),
  text("equalizerChars", "Equalizer-Zeichen", MUSIC, "▁▂▃▄▅▆▇█", 20),
  number("vinylSpeed", "Platten-Drehtempo", MUSIC, 0.16, 0, 1, undefined, 0.01),
  number("vinylSize", "Platten-Grösse (Zeichen)", MUSIC, 21, 8, 40),
  number("coverSize", "Cover-Grösse", MUSIC, 176, 40, 600, "px"),
  number("musicTitleSize", "Titel-Grösse", MUSIC, 38, 10, 120, "px"),
  number("musicBarWidth", "Fortschrittsbalken (Zeichen)", MUSIC, 32, 5, 100),
  choice("musicIn", "Einblenden", MUSIC, "glitch", ANIMATIONS),
  choice("musicOut", "Ausblenden", MUSIC, "glitch", ANIMATIONS),

  // Effects (chat triggers), apply when an action does not specify anything else
  number("fxDuration", "Standarddauer", FX, 4, 0.5, 120, "s", 0.5),
  number("fxSize", "Standardgrösse", FX, 360, 20, 1920, "px"),
  number("fxTextSize", "Textgrösse", FX, 64, 8, 300, "px"),
  number("fxMargin", "Zufallsposition: Abstand zum Rand", FX, 20, 0, 50, "%"),
  number("fxMax", "Max. gleichzeitig", FX, 8, 1, 30),
  choice("fxIn", "Einblenden", FX, "glitch", ANIMATIONS),
  choice("fxOut", "Ausblenden", FX, "glitch", ANIMATIONS),

  // Stinger
  number("stingerDuration", "Länge", STINGER, 1.6, 0.5, 5, "s", 0.05),
  number("stingerCut", "Übergangspunkt", STINGER, 0.75, 0.1, 5, "s", 0.05),
  number("stingerFall", "Fallzeit der Spalten", STINGER, 0.42, 0.05, 2, "s", 0.01),
  number("stingerColumn", "Spaltenbreite", STINGER, 24, 8, 96, "px"),
  text("stingerText", "Text", STINGER, "> SZENENWECHSEL"),
  flag("stingerLogo", "Logo", STINGER, true),

  // Twitch banners
  text("bannerProfileText", "Profilbanner: Text", BANNER, "> willkommen in der matrix"),
  text("bannerProfileSub", "Profilbanner: Untertitel", BANNER, "Games · Talk · Community"),
  text("bannerOfflineStatus", "Offline-Banner: Status", BANNER, "○ OFFLINE"),
  text("bannerOfflineTitle", "Offline-Banner: Titel", BANNER, "STREAM OFFLINE"),
  text("bannerOfflineText", "Offline-Banner: Text", BANNER, "> Folge dem Kanal, dann verpasst du den nächsten Stream nicht."),
  lines("bannerOfflineLines", "Offline-Banner: Terminal", BANNER, ["connection closed by remote host", "saving session ... ok", "awaiting next broadcast"]),
  number("bannerLoop", "Schleifenlänge", BANNER, 4, 1, 20, "s"),
  number("bannerProfileFps", "Profilbanner: Bildrate", BANNER, 12, 1, 30),
  number("bannerOfflineFps", "Offline-Banner: Bildrate", BANNER, 10, 1, 30),
  number("bannerRainDensity", "Regen-Dichte", BANNER, 100, 0, 100, "%"),
  // Minimes: commands, rules and movement are the same for all themes with minimes
  ...MINIME_FIELDS,
  color("minimeDefaultColor", "Farbe ohne eigene Wahl", MINIME_LOOK, "#39ff14"),
  color("minimeFace", "Gesicht (Kapuzeninneres)", MINIME_LOOK, "#000000"),
  number("minimeSize", "Breite der Figur", MINIME_LOOK, 90, 30, 300, "px"),
  number("minimeGround", "Abstand zum unteren Rand", MINIME_LOOK, 70, 0, 300, "px"),
  number("minimeStroke", "Strichstärke", MINIME_LOOK, 2.5, 0.5, 8, undefined, 0.5),
  number("minimeGlow", "Glühen (Stärke)", MINIME_LOOK, 1, 0, 3, undefined, 0.1),
  number("minimeFloatHeight", "Schweben: Höhe", MINIME_LOOK, 6, 0, 40, "px"),
  number("minimeFloatMs", "Schweben: Dauer auf oder ab", MINIME_LOOK, 1800, 200, 10_000, "ms"),
  number("minimeTilt", "Neigung beim Wandern (Grad)", MINIME_LOOK, 8, 0, 45),
  number("minimeJetColumns", "Düse: Spalten", MINIME_LOOK, 3, 1, 8),
  number("minimeJetLength", "Düse: Zeichen je Spalte", MINIME_LOOK, 4, 1, 12),
  number("minimeJetSize", "Düse: Zeichengrösse", MINIME_LOOK, 12, 6, 40, "px"),
  number("minimeJetSpeed", "Düse: Fallzeit", MINIME_LOOK, 700, 100, 5000, "ms"),
  flag("minimeNames", "Namen anzeigen", MINIME_LOOK, true),
  number("minimeNameSize", "Name: Schriftgrösse", MINIME_LOOK, 16, 8, 48, "px"),
  number("minimeNameGap", "Name: Abstand zum Kopf", MINIME_LOOK, 4, 0, 60, "px"),
  // Idle animations: frequency 0 = never
  number("minimeBackflipWeight", "Backflip: Häufigkeit", MINIME_MOVES, 8, 0, 100),
  number("minimeBackflipMs", "Backflip: Dauer", MINIME_MOVES, 1300, 200, 10_000, "ms"),
  number("minimeBackflipHeight", "Backflip: Sprunghöhe", MINIME_MOVES, 60, 0, 300, "px"),
  number("minimeGlitchWeight", "Glitch: Häufigkeit", MINIME_MOVES, 10, 0, 100),
  number("minimeGlitchMs", "Glitch: Dauer", MINIME_MOVES, 600, 100, 5000, "ms"),
  number("minimeGlitchShift", "Glitch: Versatz", MINIME_MOVES, 6, 0, 40, "px"),
  number("minimeLookWeight", "Umschauen: Häufigkeit", MINIME_MOVES, 15, 0, 100),
  number("minimeLookMs", "Umschauen: Dauer", MINIME_MOVES, 2400, 300, 10_000, "ms"),
  number("minimeLookShift", "Umschauen: Augenweg", MINIME_MOVES, 4, 0, 20, "px"),
  number("minimeSpinWeight", "Drehen: Häufigkeit", MINIME_MOVES, 8, 0, 100),
  number("minimeSpinMs", "Drehen: Dauer", MINIME_MOVES, 1000, 200, 10_000, "ms"),
  number("minimeSpinTurns", "Drehen: Umdrehungen", MINIME_MOVES, 2, 1, 10),
  number("minimeSleepWeight", "Schlafen: Häufigkeit", MINIME_MOVES, 5, 0, 100),
  number("minimeSleepMs", "Schlafen: Dauer", MINIME_MOVES, 7000, 1000, 60_000, "ms"),
  number("minimeSleepDrop", "Schlafen: Absinken", MINIME_MOVES, 10, 0, 100, "px"),
  text("minimeSleepText", "Schlafen: aufsteigendes Zeichen", MINIME_MOVES, "z", 4),
  number("minimeBlinkEvery", "Blinzeln alle (0 = nie)", MINIME_MOVES, 4000, 0, 30_000, "ms"),
  number("minimeBoostMs", "Reaktion auf Chat: Dauer", MINIME_MOVES, 700, 100, 5000, "ms"),
  number("minimeBoostHeight", "Reaktion auf Chat: Hüpfhöhe", MINIME_MOVES, 18, 0, 200, "px"),
  number("minimeBoostJet", "Reaktion auf Chat: Düse länger (Faktor)", MINIME_MOVES, 2, 1, 4, undefined, 0.1),
  // Commands page (public, /s/<login>/): shared texts from the core, plus the look
  ...INFO_FIELDS,
  flag("infoRain", "Befehlsseite: Matrix-Regen im Hintergrund", INFO_GROUP, true),
] as const satisfies readonly SettingField[];

export type MatrixValues = ValuesOf<typeof FIELDS>;

const GROUP_SCENES = {
  [RAIN]: ["starting", "brb", "ending", "alerts", "info"],
  [SCREENS]: ["starting", "brb", "ending"],
  [ALERTS]: ["alerts"],
  [CHAT]: ["chat"],
  [CAM]: ["cam"],
  [MUSIC]: ["music"],
  [FX]: ["fx"],
  [STINGER]: [],
  [BANNER]: [],
  [MINIME_LOOK]: ["minimes"],
  [MINIME_MOVES]: ["minimes"],
  [MINIME_COMMANDS]: ["minimes"],
  [MINIME_RULES]: ["minimes"],
  [MINIME_MOTION]: ["minimes"],
  [INFO_GROUP]: ["info"],
} as const;

// On first login: channel name and ASCII logo from the Twitch login instead of the samples
const personalize = (login: string) => ({ channelName: login.toUpperCase(), logo: asciiText(login) });

export const matrixSettings: ThemeSchema = { id: "matrix", name: "Matrix", fields: FIELDS, groupScenes: GROUP_SCENES, personalize };
