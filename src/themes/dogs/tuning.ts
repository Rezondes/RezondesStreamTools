// Fine-tuning fields of the Dogs theme: every visible value of its scenes as its own field (sizes, gaps, angles,
// durations, the color and font of each text, the share of shared values per use), one file per group in tuning/.
// Each group holds the fields of exactly the scenes they change, so a scene page shows only what changes it; fields of
// every scene are on the general page. Colors and fonts stay empty and follow the theme value until the streamer sets
// one (inherits). The CSS reads them as var(--key). The Rust mirror is generated: node scripts/tuning.ts.
import type { SceneName, SettingField } from "../../core/theme.ts";
import { ALERTS_TUNING } from "./tuning/alerts.ts";
import { BRB_TUNING } from "./tuning/brb.ts";
import { CAM_TUNING } from "./tuning/cam.ts";
import { CHAT_TUNING } from "./tuning/chat.ts";
import { CHAT_MUSIC_TUNING } from "./tuning/chatMusic.ts";
import { ENDING_TUNING } from "./tuning/ending.ts";
import { ENDING_STATS_TUNING } from "./tuning/endingStats.ts";
import { FX_TUNING } from "./tuning/fx.ts";
import { INFO_TUNING } from "./tuning/info.ts";
import { MINIMES_TUNING } from "./tuning/minimes.ts";
import { MUSIC_TUNING } from "./tuning/music.ts";
import { OFFLINE_BANNER_TUNING } from "./tuning/offlineBanner.ts";
import { PROFILE_BANNER_TUNING } from "./tuning/profileBanner.ts";
import { STARTING_TUNING } from "./tuning/starting.ts";
import { STARTING_BRB_ALERTS_TUNING } from "./tuning/startingBrbAlerts.ts";
import { STARTING_BRB_ENDING_STATS_ALERTS_CAM_INFO_TUNING } from "./tuning/startingBrbEndingStatsAlertsCamInfo.ts";
import { STARTING_BRB_ENDING_STATS_ALERTS_CAM_MUSIC_INFO_TUNING } from "./tuning/startingBrbEndingStatsAlertsCamMusicInfo.ts";
import { STARTING_BRB_ENDING_STATS_ALERTS_CHAT_CAM_MUSIC_INFO_TUNING } from "./tuning/startingBrbEndingStatsAlertsChatCamMusicInfo.ts";
import { STARTING_BRB_ENDING_STATS_ALERTS_MINIMES_TUNING } from "./tuning/startingBrbEndingStatsAlertsMinimes.ts";
import { STARTING_BRB_MUSIC_TUNING } from "./tuning/startingBrbMusic.ts";
import { STARTING_ENDING_TUNING } from "./tuning/startingEnding.ts";
import { STATS_TUNING } from "./tuning/stats.ts";
import { STINGER_TUNING } from "./tuning/stinger.ts";

// typed as plain fields: the values type comes generated from the server (src/generated/themes), and the literal
// types of hundreds of fields are too much for the compiler
export const TUNING_FIELDS: readonly SettingField[] = ([] as readonly SettingField[]).concat(STARTING_TUNING, STARTING_ENDING_TUNING, STARTING_BRB_ALERTS_TUNING, STARTING_BRB_MUSIC_TUNING, STARTING_BRB_ENDING_STATS_ALERTS_MINIMES_TUNING, STARTING_BRB_ENDING_STATS_ALERTS_CAM_INFO_TUNING, STARTING_BRB_ENDING_STATS_ALERTS_CAM_MUSIC_INFO_TUNING, STARTING_BRB_ENDING_STATS_ALERTS_CHAT_CAM_MUSIC_INFO_TUNING, BRB_TUNING, ENDING_TUNING, ENDING_STATS_TUNING, STATS_TUNING, ALERTS_TUNING, CHAT_TUNING, CHAT_MUSIC_TUNING, CAM_TUNING, MUSIC_TUNING, FX_TUNING, INFO_TUNING, MINIMES_TUNING, OFFLINE_BANNER_TUNING, PROFILE_BANNER_TUNING, STINGER_TUNING);

export const TUNING_GROUPS: Readonly<Record<string, readonly SceneName[]>> = {
  "Feinschliff: Starting": ["starting"],
  "Feinschliff: Starting, Ending": ["starting", "ending"],
  "Feinschliff: Starting, BRB, Alerts": ["starting", "brb", "alerts"],
  "Feinschliff: Starting, BRB, Musik": ["starting", "brb", "music"],
  "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Minimes": ["starting", "brb", "ending", "stats", "alerts", "minimes"],
  "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Kamera-Rahmen, Befehlsseite": ["starting", "brb", "ending", "stats", "alerts", "cam", "info"],
  "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Kamera-Rahmen, Musik, Befehlsseite": ["starting", "brb", "ending", "stats", "alerts", "cam", "music", "info"],
  "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Kamera-Rahmen, Musik, Befehlsseite": ["starting", "brb", "ending", "stats", "alerts", "chat", "cam", "music", "info"],
  "Feinschliff: BRB": ["brb"],
  "Feinschliff: Ending": ["ending"],
  "Feinschliff: Ending, Statistik": ["ending", "stats"],
  "Feinschliff: Statistik": ["stats"],
  "Feinschliff: Alerts": ["alerts"],
  "Feinschliff: Chat": ["chat"],
  "Feinschliff: Chat, Musik": ["chat", "music"],
  "Feinschliff: Kamera-Rahmen": ["cam"],
  "Feinschliff: Musik": ["music"],
  "Feinschliff: Effekte": ["fx"],
  "Feinschliff: Befehlsseite": ["info"],
  "Feinschliff: Minimes": ["minimes"],
};
