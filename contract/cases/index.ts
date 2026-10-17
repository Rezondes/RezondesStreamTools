// All contract cases in the order they run; later cases build on the sessions and data of earlier ones.
import type { Case } from "../client.ts";
import { ACCOUNT_CASES } from "./account.ts";
import { AUTH_CASES } from "./auth.ts";
import { DATA_CASES } from "./data.ts";
import { MEDIA_CASES } from "./media.ts";
import { OVERLAY_CASES } from "./overlay.ts";
import { RIGHTS_CASES } from "./rights.ts";

export const CASES: readonly Case[] = [...AUTH_CASES, ...RIGHTS_CASES, ...OVERLAY_CASES, ...DATA_CASES, ...MEDIA_CASES, ...ACCOUNT_CASES];
