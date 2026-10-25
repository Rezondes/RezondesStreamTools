// Fine-tuning fields of the Dachdecker theme: every visible value of its scenes as its own field (sizes, gaps, angles,
// durations, the color and font of each text, the share of shared values per use), one file per group in tuning/.
// Each group holds the fields of exactly the scenes they change, so a scene page shows only what changes it; fields of
// every scene are on the general page. Colors and fonts stay empty and follow the theme value until the streamer sets
// one (inherits). The CSS reads them as var(--key). The Rust mirror is generated: node scripts/tuning.ts.
import type { SceneName, SettingField } from "../../core/theme.ts";
import { ALERTS_TUNING } from "./tuning/alerts.ts";
import { ALERTS_CAM_TUNING } from "./tuning/alertsCam.ts";
import { ALERTS_MUSIC_INFO_TUNING } from "./tuning/alertsMusicInfo.ts";
import { BRB_TUNING } from "./tuning/brb.ts";
import { CAM_TUNING } from "./tuning/cam.ts";
import { CHAT_TUNING } from "./tuning/chat.ts";
import { ENDING_TUNING } from "./tuning/ending.ts";
import { FX_TUNING } from "./tuning/fx.ts";
import { GENERAL_TUNING } from "./tuning/general.ts";
import { INFO_TUNING } from "./tuning/info.ts";
import { MINIMES_TUNING } from "./tuning/minimes.ts";
import { MUSIC_TUNING } from "./tuning/music.ts";
import { OFFLINE_BANNER_TUNING } from "./tuning/offlineBanner.ts";
import { PROFILE_BANNER_TUNING } from "./tuning/profileBanner.ts";
import { STARTING_TUNING } from "./tuning/starting.ts";
import { STARTING_BRB_TUNING } from "./tuning/startingBrb.ts";
import { STARTING_BRB_ENDING_TUNING } from "./tuning/startingBrbEnding.ts";
import { STARTING_MUSIC_TUNING } from "./tuning/startingMusic.ts";
import { STATS_TUNING } from "./tuning/stats.ts";
import { STATS_ALERTS_MUSIC_INFO_TUNING } from "./tuning/statsAlertsMusicInfo.ts";
import { STINGER_TUNING } from "./tuning/stinger.ts";

// typed as plain fields: the values type comes generated from the server (src/generated/themes), and the literal
// types of hundreds of fields are too much for the compiler
export const TUNING_FIELDS: readonly SettingField[] = ([] as readonly SettingField[]).concat(STARTING_TUNING, STARTING_BRB_TUNING, STARTING_MUSIC_TUNING, STARTING_BRB_ENDING_TUNING, BRB_TUNING, ENDING_TUNING, STATS_TUNING, STATS_ALERTS_MUSIC_INFO_TUNING, ALERTS_TUNING, ALERTS_CAM_TUNING, ALERTS_MUSIC_INFO_TUNING, CHAT_TUNING, CAM_TUNING, MUSIC_TUNING, FX_TUNING, INFO_TUNING, MINIMES_TUNING, OFFLINE_BANNER_TUNING, PROFILE_BANNER_TUNING, STINGER_TUNING, GENERAL_TUNING);

export const TUNING_GROUPS: Readonly<Record<string, readonly SceneName[]>> = {
  "Feinschliff: Starting": ["starting"],
  "Feinschliff: Starting, BRB": ["starting", "brb"],
  "Feinschliff: Starting, Musik": ["starting", "music"],
  "Feinschliff: Starting, BRB, Ending": ["starting", "brb", "ending"],
  "Feinschliff: BRB": ["brb"],
  "Feinschliff: Ending": ["ending"],
  "Feinschliff: Statistik": ["stats"],
  "Feinschliff: Statistik, Alerts, Musik, Befehlsseite": ["stats", "alerts", "music", "info"],
  "Feinschliff: Alerts": ["alerts"],
  "Feinschliff: Alerts, Kamera-Rahmen": ["alerts", "cam"],
  "Feinschliff: Alerts, Musik, Befehlsseite": ["alerts", "music", "info"],
  "Feinschliff: Chat": ["chat"],
  "Feinschliff: Kamera-Rahmen": ["cam"],
  "Feinschliff: Musik": ["music"],
  "Feinschliff: Effekte": ["fx"],
  "Feinschliff: Befehlsseite": ["info"],
  "Feinschliff: Minimes": ["minimes"],
};
