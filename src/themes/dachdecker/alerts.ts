// Alert texts of the Dachdecker theme (DESIGN-DACHDECKER.md "Alerts"): per kind the head line, the line and the text
// over the dimension line ("+1 DACHDECKER"), with the placeholders filled by the core (describeAlert); the hype train
// end uses its own line. Plus the tone of a chatter name when names take the chatter's tone. Check: alerts.check.ts.
import { alertTextKeys, describeAlert } from "../../core/alerts/alerts.ts";
import { hash, seedOf } from "../../core/hash.ts";
import type { Alert, AlertKind } from "../../core/types.ts";

export const ALERT_KEYS = alertTextKeys("Tag");
// Text over the dimension line per kind
const DIM_KEYS: Record<AlertKind, string> = {
  follow: "followDim", sub: "subDim", resub: "resubDim", gift: "giftDim", raid: "raidDim", cheer: "cheerDim", redeem: "redeemDim", hype: "hypeDim",
};

export type AlertTexts = { tag: string; line: string; dim: string };

// The dimension text is filled like a head line: describeAlert with the dimension keys in place of the head keys
export function alertTexts(alert: Alert, values: Record<string, unknown>): AlertTexts {
  const { tag, line } = describeAlert(alert, values, ALERT_KEYS);
  return { tag, line, dim: describeAlert(alert, values, { ...ALERT_KEYS, tag: DIM_KEYS }).tag };
}

// The same chatter always gets the same one of count tones
export const toneOf = (login: string, count: number) => Math.floor(hash(seedOf(login)) * count);
