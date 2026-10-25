// Fine-tuning fields of the King of the Hill theme: every visible value of its scenes as its own field (sizes, gaps, angles,
// durations, the color and font of each text, the share of shared values per use), one file per group in tuning/.
// Each group holds the fields of exactly the scenes they change, so a scene page shows only what changes it; fields of
// every scene are on the general page. Colors and fonts stay empty and follow the theme value until the streamer sets
// one (inherits). The CSS reads them as var(--key). The Rust mirror is generated: node scripts/tuning.ts.
import type { SceneName, SettingField } from "../../core/theme.ts";
import { ALERTS_TUNING } from "./tuning/alerts.ts";
import { ALERTS_CAM_MUSIC_FX_TUNING } from "./tuning/alertsCamMusicFx.ts";
import { ALERTS_CHAT_MUSIC_FX_TUNING } from "./tuning/alertsChatMusicFx.ts";
import { ALERTS_FX_TUNING } from "./tuning/alertsFx.ts";
import { ALERTS_MUSIC_TUNING } from "./tuning/alertsMusic.ts";
import { CAM_TUNING } from "./tuning/cam.ts";
import { CAM_MINIMES_TUNING } from "./tuning/camMinimes.ts";
import { CHAT_TUNING } from "./tuning/chat.ts";
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
import { STARTING_BRB_ENDING_INFO_TUNING } from "./tuning/startingBrbEndingInfo.ts";
import { STARTING_BRB_ENDING_MUSIC_TUNING } from "./tuning/startingBrbEndingMusic.ts";
import { STATS_TUNING } from "./tuning/stats.ts";
import { STINGER_TUNING } from "./tuning/stinger.ts";

// typed as plain fields: the values type comes generated from the server (src/generated/themes), and the literal
// types of hundreds of fields are too much for the compiler
export const TUNING_FIELDS: readonly SettingField[] = ([] as readonly SettingField[]).concat(STARTING_TUNING, STARTING_BRB_TUNING, STARTING_BRB_ENDING_TUNING, STARTING_BRB_ENDING_INFO_TUNING, STARTING_BRB_ENDING_MUSIC_TUNING, STATS_TUNING, ALERTS_TUNING, ALERTS_FX_TUNING, ALERTS_MUSIC_TUNING, ALERTS_CHAT_MUSIC_FX_TUNING, ALERTS_CAM_MUSIC_FX_TUNING, CHAT_TUNING, CAM_TUNING, CAM_MINIMES_TUNING, MUSIC_TUNING, FX_TUNING, INFO_TUNING, MINIMES_TUNING, OFFLINE_BANNER_TUNING, PROFILE_BANNER_TUNING, STINGER_TUNING, GENERAL_TUNING);

export const TUNING_GROUPS: Readonly<Record<string, readonly SceneName[]>> = {
  "Feinschliff: Starting": ["starting"],
  "Feinschliff: Starting, BRB": ["starting", "brb"],
  "Feinschliff: Starting, BRB, Ending": ["starting", "brb", "ending"],
  "Feinschliff: Starting, BRB, Ending, Befehlsseite": ["starting", "brb", "ending", "info"],
  "Feinschliff: Starting, BRB, Ending, Musik": ["starting", "brb", "ending", "music"],
  "Feinschliff: Statistik": ["stats"],
  "Feinschliff: Alerts": ["alerts"],
  "Feinschliff: Alerts, Effekte": ["alerts", "fx"],
  "Feinschliff: Alerts, Musik": ["alerts", "music"],
  "Feinschliff: Alerts, Chat, Musik, Effekte": ["alerts", "chat", "music", "fx"],
  "Feinschliff: Alerts, Kamera-Rahmen, Musik, Effekte": ["alerts", "cam", "music", "fx"],
  "Feinschliff: Chat": ["chat"],
  "Feinschliff: Kamera-Rahmen": ["cam"],
  "Feinschliff: Kamera-Rahmen, Minimes": ["cam", "minimes"],
  "Feinschliff: Musik": ["music"],
  "Feinschliff: Effekte": ["fx"],
  "Feinschliff: Befehlsseite": ["info"],
  "Feinschliff: Minimes": ["minimes"],
};
