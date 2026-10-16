// Kontext Alerts: Kopfzeile und Zeile eines Alerts aus den Texten eines Themes und welche Nachricht als Zitat gilt.
// Die Regeln (Platzhalter, Hype-Ende, Geschenk an eine Person, Abo-Stufe) sind für jedes Theme gleich; das Theme sagt
// nur, unter welchen Schlüsseln seine Texte stehen (AlertTextKeys), und gestaltet. Rein; Check: alerts.check.ts.
import { sound } from "../fields.ts";
import { fillTemplate } from "../template.ts";
import type { Alert, AlertKind } from "../types.ts";

const KINDS: readonly AlertKind[] = ["follow", "sub", "resub", "gift", "raid", "cheer", "redeem", "hype"];

// Schlüssel der Texte im Schema eines Themes. Optional: giftOneLine/giftToLine (ein einzelnes Geschenk-Abo, mit oder
// ohne Beschenkten in text), tierSuffix (hinter der Kopfzeile von Subs mit {detail} = Stufe, tierUpper in Grossbuchstaben)
export type AlertTextKeys = {
  tag: Record<AlertKind, string>;
  line: Record<AlertKind, string>;
  hypeEndLine: string;
  giftOneLine?: string;
  giftToLine?: string;
  tierSuffix?: string;
  tierUpper?: boolean;
};

// Schlüssel nach dem üblichen Muster: Kopfzeile <art><tagSuffix> (z.B. followTag), Zeile <art>Line, beim Hype Train
// hypeBeginLine und hypeEndLine; extra ergänzt die optionalen Texte
export function alertTextKeys(tagSuffix: string, extra: Partial<AlertTextKeys> = {}): AlertTextKeys {
  const per = (key: (kind: AlertKind) => string) => Object.fromEntries(KINDS.map(kind => [kind, key(kind)])) as Record<AlertKind, string>;
  return { tag: per(kind => kind + tagSuffix), line: per(kind => (kind === "hype" ? "hypeBeginLine" : `${kind}Line`)), hypeEndLine: "hypeEndLine", ...extra };
}

// Töne je Alert-Art für Themes mit eingebauten Tönen: Schlüssel und die Felder dazu (leer = eingebauter Ton des Themes),
// samt Ton beim Ausblenden
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

// Werte für die Platzhalter {user}, {amount}, {detail}, {text}
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

// Nachricht des Zuschauers als Zitat; bei Geschenk-Abos steht in text der Beschenkte, das ist kein Zitat
export const alertQuote = (alert: Alert) => (alert.text && alert.kind !== "gift" ? alert.text : null);
