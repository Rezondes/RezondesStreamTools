// One Dogs alert from the settings: its head line and line (texts of the core, the raid with one dog in its own line,
// the viewer's message instead of the line), the toy of its kind, the raid pack (raidPack in the core) and the schedule
// with the length of the alert. Pure; check: alertPlan.check.ts.
import { alertQuote, alertTextKeys, describeAlert } from "../../core/alerts/alerts.ts";
import { raidPack, type RaidPack } from "../../core/alerts/raidPack.ts";
import { fillTemplate } from "../../core/template.ts";
import type { Alert, AlertKind } from "../../core/types.ts";
import { alertSchedule, type AlertSchedule, alertTimesOf } from "./alert.ts";
import type { DogsValues } from "./settings.ts";

export type AlertToy = "ball" | "knochen" | "frisbee" | "leckerli";
export type AlertPlan = { tag: string; line: string; toy: AlertToy; pack: RaidPack | null; schedule: AlertSchedule };

const TOY_KEYS: Record<AlertKind, keyof DogsValues> = { follow: "toyFollow", sub: "toySub", resub: "toySub", gift: "toyGift", raid: "toyRaid", cheer: "toyCheer", redeem: "toyRedeem", hype: "toyHype" };
const KEYS = alertTextKeys("Tag");
const PERCENT = 100;

function packOf(alert: Alert, values: DogsValues): RaidPack | null {
  if (alert.kind !== "raid" || !values.raidPack || !alert.amount) return null;
  return raidPack({
    raiders: alert.amount, maxDogs: values.raidMaxDogs, maxOnScreen: values.raidMaxOnScreen, crossMs: values.raidCrossMs,
    speedSpread: values.raidSpeedSpread / PERCENT, lanes: values.raidLanes, seed: values.raidSeed,
  });
}

export function planAlert(alert: Alert, values: DogsValues): AlertPlan {
  const texts = describeAlert(alert, values, KEYS);
  const quote = values.alertQuote ? alertQuote(alert) : null;
  const one = alert.kind === "raid" && alert.amount === 1 ? fillTemplate(values.raidLineOne, { user: alert.user, amount: 1 }) : texts.line;
  const pack = packOf(alert, values);
  return {
    tag: texts.tag, line: quote ? fillTemplate(values.quoteFormat, { text: quote }) : one,
    toy: values[TOY_KEYS[alert.kind]] as AlertToy, pack, schedule: alertSchedule(values.alertDuration, pack?.endMs ?? 0, values.raidBarkEvery, alertTimesOf(values)),
  };
}

// The length of an alert in ms for the queue (useAlerts)
export const alertLengthMs = (alert: Alert, values: DogsValues) => planAlert(alert, values).schedule.end * 1000;
