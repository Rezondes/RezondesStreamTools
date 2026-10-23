// Alert texts of the Kebab theme (DESIGN-KEBAB.md "Alerts"): per kind the head line, the dish, the line under the name
// and the item at the bottom of the bon, with the placeholders filled by the core (describeAlert, the dish and the
// item through its head line keys); the viewer's message replaces the line when quotes are on. Plus the order number,
// the same for the same viewer and kind. Check: alerts.check.ts.
import { alertQuote, alertTextKeys, describeAlert } from "../../core/alerts/alerts.ts";
import { hash, seedOf } from "../../core/hash.ts";
import { fillTemplate } from "../../core/template.ts";
import type { Alert, AlertKind } from "../../core/types.ts";
import { type BonItem, bonItems } from "./bon.ts";

export const ALERT_KEYS = alertTextKeys("Tag");
// The dish and the item per kind, filled like a head line (describeAlert with these keys in place of the head keys)
const DISH_KEYS: Record<AlertKind, string> = {
  follow: "followDish", sub: "subDish", resub: "resubDish", gift: "giftDish", raid: "raidDish", cheer: "cheerDish", redeem: "redeemDish", hype: "hypeDish",
};
const ITEM_KEYS: Record<AlertKind, string> = {
  follow: "followItem", sub: "subItem", resub: "resubItem", gift: "giftItem", raid: "raidItem", cheer: "cheerItem", redeem: "redeemItem", hype: "hypeItem",
};
const DISH = { ...ALERT_KEYS, tag: DISH_KEYS };
const ITEM = { ...ALERT_KEYS, tag: ITEM_KEYS };
// fixed: order numbers have three digits
const NUMBER = { from: 100, span: 900 };

export type AlertTexts = { tag: string; dish: string; line: string; item: BonItem | null; number: string };

export function alertTexts(alert: Alert, values: Record<string, unknown>): AlertTexts {
  const { tag, line } = describeAlert(alert, values, ALERT_KEYS);
  const said = values.alertQuote === true ? alertQuote(alert) : null;
  const format = typeof values.quoteFormat === "string" ? values.quoteFormat : "{text}";
  const number = String(NUMBER.from + Math.floor(hash(seedOf(`${alert.kind}:${alert.user}`)) * NUMBER.span));
  const template = typeof values.alertNumber === "string" ? values.alertNumber : "{number}";
  return {
    tag,
    dish: describeAlert(alert, values, DISH).tag,
    line: said ? fillTemplate(format, { text: said }) : line,
    item: bonItems([describeAlert(alert, values, ITEM).tag])[0] ?? null,
    number: fillTemplate(template, { number }),
  };
}
