// Context alerts: header and line of an alert from the texts of a theme, and which message counts as a quote.
// The rules (placeholders, hype end, gift to one person, sub tier) are the same for every theme; the theme only says
// under which keys its texts are (AlertTextKeys), and does the styling. Pure; check: alerts.check.ts.
import { sound } from "../fields.ts";
import { fillTemplate } from "../template.ts";
import type { Alert, AlertKind } from "../types.ts";

const KINDS: readonly AlertKind[] = ["follow", "sub", "resub", "gift", "raid", "cheer", "redeem", "hype"];

// Keys of the texts in a theme's schema. Optional: giftOneLine/giftToLine (a single gift sub, with or
// without recipient in text), tierSuffix (after the header of subs with {detail} = tier, tierUpper in upper case)
export type AlertTextKeys = {
  tag: Record<AlertKind, string>;
  line: Record<AlertKind, string>;
  hypeEndLine: string;
  giftOneLine?: string;
  giftToLine?: string;
  tierSuffix?: string;
  tierUpper?: boolean;
};

// Keys following the usual pattern: header <kind><tagSuffix> (e.g. followTag), line <kind>Line, for the hype train
// hypeBeginLine and hypeEndLine; extra adds the optional texts
export function alertTextKeys(tagSuffix: string, extra: Partial<AlertTextKeys> = {}): AlertTextKeys {
  const per = (key: (kind: AlertKind) => string) => Object.fromEntries(KINDS.map(kind => [kind, key(kind)])) as Record<AlertKind, string>;
  return { tag: per(kind => kind + tagSuffix), line: per(kind => (kind === "hype" ? "hypeBeginLine" : `${kind}Line`)), hypeEndLine: "hypeEndLine", ...extra };
}

// Sounds per alert kind for themes with built-in sounds: keys and their fields (empty = the theme's built-in sound),
// plus the sound on fade-out
export const ALERT_SOUND_KEYS = {
  follow: "soundFollow", sub: "soundSub", resub: "soundResub", gift: "soundGift", raid: "soundRaid", cheer: "soundCheer", redeem: "soundRedeem", hype: "soundHype",
} as const satisfies Record<AlertKind, string>;
export const alertSoundFields = (group: string) => [
  sound("soundFollow", "Ton Follow (leer = eingebaut)", group),
  sound("soundSub", "Ton Sub", group),
  sound("soundResub", "Ton Resub", group),
  sound("soundGift", "Ton Gift", group),
  sound("soundRaid", "Ton Raid", group),
  sound("soundCheer", "Ton Bits", group),
  sound("soundRedeem", "Ton Kanalpunkte", group),
  sound("soundHype", "Ton Hype Train", group),
  sound("soundLeave", "Ton beim Ausblenden", group),
] as const;

// Values for the placeholders {user}, {amount}, {detail}, {text}
const alertVars = (alert: Alert) => ({ user: alert.user, amount: alert.amount ?? 0, detail: alert.detail ?? "", text: alert.text ?? "" });

export function describeAlert(alert: Alert, values: Record<string, unknown>, keys: AlertTextKeys): { tag: string; line: string } {
  const text = (key: string | undefined) => { const value = key ? values[key] : undefined; return typeof value === "string" ? value : ""; };
  return { tag: fillTemplate(text(keys.tag[alert.kind]), alertVars(alert)) + tier(alert, text, keys), line: fillTemplate(text(lineKey(alert, keys)), alertVars(alert)) };
}

function lineKey(alert: Alert, keys: AlertTextKeys) {
  if (alert.kind === "hype" && alert.detail === "end") return keys.hypeEndLine;
  if (alert.kind === "gift" && alert.amount === 1 && keys.giftOneLine && keys.giftToLine) return alert.text ? keys.giftToLine : keys.giftOneLine;
  return keys.line[alert.kind];
}

function tier(alert: Alert, text: (key: string | undefined) => string, keys: AlertTextKeys) {
  if (!keys.tierSuffix || !alert.detail || (alert.kind !== "sub" && alert.kind !== "resub")) return "";
  return fillTemplate(text(keys.tierSuffix), { detail: keys.tierUpper ? alert.detail.toUpperCase() : alert.detail });
}

// The viewer's message as a quote; for gift subs text holds the recipient, which is not a quote
export const alertQuote = (alert: Alert) => (alert.text && alert.kind !== "gift" ? alert.text : null);
