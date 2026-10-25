// Fine-tuning fields of the Matrix theme: every visible value of its scenes as its own field (sizes, gaps, angles,
// durations, the color and font of each text, the share of shared values per use), one file per group in tuning/.
// Each group holds the fields of exactly the scenes they change, so a scene page shows only what changes it; fields of
// every scene are on the general page. Colors and fonts stay empty and follow the theme value until the streamer sets
// one (inherits). The CSS reads them as var(--key). The Rust mirror is generated: node scripts/tuning.ts.
import type { SceneName, SettingField } from "../../core/theme.ts";
import { ALERTS_TUNING } from "./tuning/alerts.ts";
import { ALERTS_CHAT_MUSIC_FX_TUNING } from "./tuning/alertsChatMusicFx.ts";
import { ALERTS_CHAT_MUSIC_FX_MINIMES_TUNING } from "./tuning/alertsChatMusicFxMinimes.ts";
import { BRB_TUNING } from "./tuning/brb.ts";
import { BRB_ENDING_STATS_ALERTS_CHAT_MUSIC_INFO_TUNING } from "./tuning/brbEndingStatsAlertsChatMusicInfo.ts";
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
import { STARTING_BRB_ENDING_TUNING } from "./tuning/startingBrbEnding.ts";
import { STARTING_BRB_ENDING_ALERTS_CAM_FX_INFO_TUNING } from "./tuning/startingBrbEndingAlertsCamFxInfo.ts";
import { STARTING_BRB_ENDING_ALERTS_CAM_FX_INFO_MINIMES_TUNING } from "./tuning/startingBrbEndingAlertsCamFxInfoMinimes.ts";
import { STARTING_BRB_ENDING_ALERTS_CAM_INFO_TUNING } from "./tuning/startingBrbEndingAlertsCamInfo.ts";
import { STARTING_BRB_ENDING_ALERTS_CHAT_MUSIC_FX_MINIMES_TUNING } from "./tuning/startingBrbEndingAlertsChatMusicFxMinimes.ts";
import { STARTING_BRB_ENDING_ALERTS_INFO_TUNING } from "./tuning/startingBrbEndingAlertsInfo.ts";
import { STARTING_BRB_ENDING_CAM_TUNING } from "./tuning/startingBrbEndingCam.ts";
import { STARTING_BRB_ENDING_STATS_ALERTS_CHAT_MUSIC_FX_INFO_TUNING } from "./tuning/startingBrbEndingStatsAlertsChatMusicFxInfo.ts";
import { STATS_TUNING } from "./tuning/stats.ts";
import { STINGER_TUNING } from "./tuning/stinger.ts";

// typed as plain fields: the values type comes generated from the server (src/generated/themes), and the literal
// types of hundreds of fields are too much for the compiler
export const TUNING_FIELDS: readonly SettingField[] = ([] as readonly SettingField[]).concat(STARTING_BRB_ENDING_TUNING, STARTING_BRB_ENDING_CAM_TUNING, STARTING_BRB_ENDING_ALERTS_INFO_TUNING, STARTING_BRB_ENDING_ALERTS_CAM_INFO_TUNING, STARTING_BRB_ENDING_ALERTS_CAM_FX_INFO_TUNING, STARTING_BRB_ENDING_ALERTS_CHAT_MUSIC_FX_MINIMES_TUNING, STARTING_BRB_ENDING_ALERTS_CAM_FX_INFO_MINIMES_TUNING, STARTING_BRB_ENDING_STATS_ALERTS_CHAT_MUSIC_FX_INFO_TUNING, BRB_TUNING, BRB_ENDING_STATS_ALERTS_CHAT_MUSIC_INFO_TUNING, ENDING_TUNING, STATS_TUNING, ALERTS_TUNING, ALERTS_CHAT_MUSIC_FX_TUNING, ALERTS_CHAT_MUSIC_FX_MINIMES_TUNING, CHAT_TUNING, CAM_TUNING, MUSIC_TUNING, FX_TUNING, INFO_TUNING, MINIMES_TUNING, OFFLINE_BANNER_TUNING, PROFILE_BANNER_TUNING, STINGER_TUNING, GENERAL_TUNING);

export const TUNING_GROUPS: Readonly<Record<string, readonly SceneName[]>> = {
  "Feinschliff: Starting, BRB, Ending": ["starting", "brb", "ending"],
  "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen": ["starting", "brb", "ending", "cam"],
  "Feinschliff: Starting, BRB, Ending, Alerts, Befehlsseite": ["starting", "brb", "ending", "alerts", "info"],
  "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Befehlsseite": ["starting", "brb", "ending", "alerts", "cam", "info"],
  "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite": ["starting", "brb", "ending", "alerts", "cam", "fx", "info"],
  "Feinschliff: Starting, BRB, Ending, Alerts, Chat, Musik, Effekte, Minimes": ["starting", "brb", "ending", "alerts", "chat", "music", "fx", "minimes"],
  "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Effekte, Befehlsseite, Minimes": ["starting", "brb", "ending", "alerts", "cam", "fx", "info", "minimes"],
  "Feinschliff: Starting, BRB, Ending, Statistik, Alerts, Chat, Musik, Effekte, Befehlsseite": ["starting", "brb", "ending", "stats", "alerts", "chat", "music", "fx", "info"],
  "Feinschliff: BRB": ["brb"],
  "Feinschliff: BRB, Ending, Statistik, Alerts, Chat, Musik, Befehlsseite": ["brb", "ending", "stats", "alerts", "chat", "music", "info"],
  "Feinschliff: Ending": ["ending"],
  "Feinschliff: Statistik": ["stats"],
  "Feinschliff: Alerts": ["alerts"],
  "Feinschliff: Alerts, Chat, Musik, Effekte": ["alerts", "chat", "music", "fx"],
  "Feinschliff: Alerts, Chat, Musik, Effekte, Minimes": ["alerts", "chat", "music", "fx", "minimes"],
  "Feinschliff: Chat": ["chat"],
  "Feinschliff: Kamera-Rahmen": ["cam"],
  "Feinschliff: Musik": ["music"],
  "Feinschliff: Effekte": ["fx"],
  "Feinschliff: Befehlsseite": ["info"],
  "Feinschliff: Minimes": ["minimes"],
};
