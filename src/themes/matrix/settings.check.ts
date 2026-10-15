// Check für settings.ts (Schema des Matrix-Themes): gültige Standardwerte, jede Gruppe hat ihre Pflichtschlüssel
// und jeder Schlüssel wird im Theme-Code benutzt (kein toter Schlüssel). Läuft mit npm test.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateSettings } from "../../core/settings.ts";
import { matrixSettings } from "./settings.ts";

const fields = matrixSettings.fields;
const defaults = Object.fromEntries(fields.map(field => [field.key, field.default]));
assert.deepEqual(validateSettings(matrixSettings, defaults).errors, []);

// Pflichtschlüssel je Gruppe (Package 5, AC1); Lautstärke steckt in den Ton-Feldern
const REQUIRED: Record<string, string[]> = {
  "Allgemein": ["accent", "dim", "line", "background", "glow", "highlight", "flash", "font", "fontSize", "channelName", "logo", "glowStrength", "scanlines", "scanlineStrength", "glitchStrength", "glitchInDuration", "glitchOutDuration"],
  "Matrix-Regen": ["rainScreens", "rainAlerts", "glyphs", "rainSizeScreens", "rainSizeAlerts", "rainDensity", "rainSpeed", "rainOpacityScreens", "rainOpacityAlerts", "rainFps"],
  "Starting, BRB, Ending": ["startingTitle", "brbTitle", "endingTitle", "brbNote", "endingThanks", "countdown", "progressBar", "terminal", "startingLines", "brbLines", "endingLines", "prompt", "typingSpeed", "terminalPauseMin", "terminalPauseMax", "terminalVisible", "ticker", "tickerSpeed", "powerOn", "powerOnDuration", "frameWidth", "frameHeight"],
  "Alerts": ["alertHeader", "followTag", "followLine", "subTag", "subLine", "resubTag", "resubLine", "giftTag", "giftLine", "raidTag", "raidLine", "cheerTag", "cheerLine", "redeemTag", "redeemLine", "hypeTag", "hypeBeginLine", "hypeEndLine", "alertDuration", "alertScale", "alertTop", "alertAlign", "alertWidth", "alertIn", "alertOut", "alertQuote", "alertTimer", "soundFollow", "soundSub", "soundResub", "soundGift", "soundRaid", "soundCheer", "soundRedeem", "soundHype"],
  "Chat": ["chatPrompt", "badgeHost", "badgeMod", "badgeVip", "badgeSub", "chatFontSize", "chatFade", "chatMax", "chatAlign", "chatOpacity", "emoteSize", "chatIn", "chatOut"],
  "Kamera-Rahmen": ["camLabel", "camRec", "camRecText", "camClock", "cornerLength", "cornerWidth"],
  "Musik": ["musicArt", "musicHeadPlaying", "musicHeadPaused", "equalizer", "equalizerBars", "musicHide", "vinylSpeed", "coverSize", "musicTitleSize"],
  "Effekte": ["fxDuration", "fxSize", "fxIn", "fxOut", "fxMargin"],
  "Stinger": ["stingerDuration", "stingerCut", "stingerText", "stingerLogo", "stingerColumn", "stingerFall"],
  "Banner": ["bannerProfileText", "bannerProfileSub", "bannerOfflineTitle", "bannerOfflineText", "bannerOfflineLines", "bannerLoop", "bannerProfileFps", "bannerOfflineFps", "bannerRainDensity"],
};
for (const [group, keys] of Object.entries(REQUIRED)) {
  for (const key of keys) assert.equal(fields.find(field => field.key === key)?.group, group, `${key} fehlt in ${group}`);
}

// Kein toter Schlüssel: jeder Schlüssel kommt im Theme-Code vor (values.key, { key }, "key" oder var(--key))
const folder = import.meta.dirname;
const files = readdirSync(folder, { recursive: true, encoding: "utf8" })
  .filter(file => /\.(ts|tsx|css)$/.test(file) && !/settings\.ts$|\.check\.ts$/.test(file));
const source = files.map(file => readFileSync(join(folder, file), "utf8")).join("\n");
const unused = fields.map(field => field.key).filter(key => !new RegExp(`\\.${key}\\b|[{,]\\s*${key}\\s*[,}]|"${key}"|var\\(--${key}\\)`).test(source));
assert.deepEqual(unused, [], `unbenutzte Schlüssel: ${unused.join(", ")}`);

console.log("matrix settings ok");
