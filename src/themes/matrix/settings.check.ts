// Check for settings.ts (schema of the matrix theme): valid defaults, every group has its required keys
// and every key is used in the theme code (no dead key). Runs with npm test.
import assert from "node:assert/strict";
import { auditTheme } from "../schemaAudit.ts";
import { matrixSettings } from "./settings.ts";

const fields = matrixSettings.fields;

// Valid defaults and no dead key (every one occurs in the theme code)
const audit = auditTheme(matrixSettings, import.meta.dirname);
assert.deepEqual(audit.errors, []);
assert.deepEqual(audit.unused, [], `unused keys: ${audit.unused.join(", ")}`);
assert.deepEqual(audit.basic, [], `simple view: ${audit.basic.join("; ")}`);

// Required keys per group (package 5, AC1); the volume is part of the sound fields
const REQUIRED: Record<string, string[]> = {
  "Allgemein": ["accent", "dim", "line", "background", "glow", "highlight", "flash", "font", "fontSize", "channelName", "logo", "glowStrength", "scanlines", "scanlineStrength", "glitchStrength", "glitchInDuration", "glitchOutDuration"],
  "Matrix-Regen": ["rainScreens", "rainAlerts", "glyphs", "quality", "rainSeed", "rainLayers", "rainSizeFar", "rainSizeMid", "rainSizeNear", "rainBlurFar", "headGlow", "glyphChange", "glyphChangeTip", "rainDensity", "rainSpeed", "rainOpacityScreens", "rainOpacityAlerts"],
  "Starting, BRB, Ending": ["startingTitle", "brbTitle", "endingTitle", "brbNote", "endingThanks", "countdown", "progressBar", "terminal", "startingLines", "brbLines", "endingLines", "prompt", "typingSpeed", "terminalPauseMin", "terminalPauseMax", "terminalVisible", "ticker", "tickerSpeed", "powerOn", "powerOnDuration", "frameWidth", "frameHeight"],
  "Alerts": ["alertHeader", "followTag", "followLine", "subTag", "subLine", "resubTag", "resubLine", "giftTag", "giftLine", "raidTag", "raidLine", "cheerTag", "cheerLine", "redeemTag", "redeemLine", "hypeTag", "hypeBeginLine", "hypeEndLine", "alertDuration", "alertScale", "alertTop", "alertAlign", "alertWidth", "alertIn", "alertOut", "alertQuote", "alertTimer", "soundFollow", "soundSub", "soundResub", "soundGift", "soundRaid", "soundCheer", "soundRedeem", "soundHype"],
  "Chat": ["chatPrompt", "badgeHost", "badgeMod", "badgeVip", "badgeSub", "chatFontSize", "chatFade", "chatMax", "chatAlign", "chatOpacity", "emoteSize", "chatIn", "chatOut"],
  "Kamera-Rahmen": ["camLabel", "camRec", "camRecText", "camClock", "cornerLength", "cornerWidth"],
  "Musik": ["musicArt", "musicHeadPlaying", "musicHeadPaused", "equalizer", "equalizerBars", "musicHide", "vinylSpeed", "coverSize", "musicTitleSize", "musicMarqueeSpeed"],
  "Effekte": ["fxDuration", "fxSize", "fxIn", "fxOut", "fxMargin"],
  "Stinger": ["stingerDuration", "stingerCut", "stingerText", "stingerLogo", "stingerColumn", "stingerFall"],
  "Profilbanner": ["bannerProfileText", "bannerProfileSub", "bannerRainDensity"],
  "Offline-Banner": ["bannerOfflineTitle", "bannerOfflineText", "bannerOfflineLines", "bannerOfflineRainDensity"],
};
for (const [group, keys] of Object.entries(REQUIRED)) {
  for (const key of keys) assert.equal(fields.find(field => field.key === key)?.group, group, `${key} fehlt in ${group}`);
}

console.log("matrix settings ok");
