// Fine-tuning fields of the Urlaub theme: every visible value of its scenes as its own field (sizes, gaps, angles,
// durations, the color and font of each text, the share of shared values per use), one file per group in tuning/.
// Each group holds the fields of exactly the scenes they change, so a scene page shows only what changes it; fields of
// every scene are on the general page. Colors and fonts stay empty and follow the theme value until the streamer sets
// one (inherits). The CSS reads them as var(--key). The Rust mirror is generated: node scripts/tuning.ts.
import type { SceneName, SettingField } from "../../core/theme.ts";
import { ALERTS_TUNING } from "./tuning/alerts.ts";
import { CAM_TUNING } from "./tuning/cam.ts";
import { CHAT_TUNING } from "./tuning/chat.ts";
import { CHAT_MUSIC_TUNING } from "./tuning/chatMusic.ts";
import { CHAT_MUSIC_FX_TUNING } from "./tuning/chatMusicFx.ts";
import { FX_TUNING } from "./tuning/fx.ts";
import { GENERAL_TUNING } from "./tuning/general.ts";
import { INFO_TUNING } from "./tuning/info.ts";
import { MINIMES_TUNING } from "./tuning/minimes.ts";
import { MUSIC_TUNING } from "./tuning/music.ts";
import { OFFLINE_BANNER_TUNING } from "./tuning/offlineBanner.ts";
import { PROFILE_BANNER_TUNING } from "./tuning/profileBanner.ts";
import { STARTING_TUNING } from "./tuning/starting.ts";
import { STARTING_ALERTS_TUNING } from "./tuning/startingAlerts.ts";
import { STARTING_BRB_TUNING } from "./tuning/startingBrb.ts";
import { STARTING_BRB_ENDING_TUNING } from "./tuning/startingBrbEnding.ts";
import { STARTING_BRB_ENDING_ALERTS_TUNING } from "./tuning/startingBrbEndingAlerts.ts";
import { STARTING_BRB_ENDING_ALERTS_CAM_MUSIC_TUNING } from "./tuning/startingBrbEndingAlertsCamMusic.ts";
import { STARTING_BRB_ENDING_CAM_FX_TUNING } from "./tuning/startingBrbEndingCamFx.ts";
import { STARTING_BRB_ENDING_CAM_INFO_TUNING } from "./tuning/startingBrbEndingCamInfo.ts";
import { STARTING_BRB_ENDING_INFO_TUNING } from "./tuning/startingBrbEndingInfo.ts";
import { STINGER_TUNING } from "./tuning/stinger.ts";

// typed as plain fields: the values type comes generated from the server (src/generated/themes), and the literal
// types of hundreds of fields are too much for the compiler
export const TUNING_FIELDS: readonly SettingField[] = ([] as readonly SettingField[]).concat(STARTING_TUNING, STARTING_ALERTS_TUNING, STARTING_BRB_TUNING, STARTING_BRB_ENDING_TUNING, STARTING_BRB_ENDING_ALERTS_TUNING, STARTING_BRB_ENDING_INFO_TUNING, STARTING_BRB_ENDING_CAM_INFO_TUNING, STARTING_BRB_ENDING_CAM_FX_TUNING, STARTING_BRB_ENDING_ALERTS_CAM_MUSIC_TUNING, ALERTS_TUNING, CHAT_TUNING, CHAT_MUSIC_TUNING, CHAT_MUSIC_FX_TUNING, CAM_TUNING, MUSIC_TUNING, FX_TUNING, INFO_TUNING, MINIMES_TUNING, OFFLINE_BANNER_TUNING, PROFILE_BANNER_TUNING, STINGER_TUNING, GENERAL_TUNING);

export const TUNING_GROUPS: Readonly<Record<string, readonly SceneName[]>> = {
  "Feinschliff: Starting": ["starting"],
  "Feinschliff: Starting, Alerts": ["starting", "alerts"],
  "Feinschliff: Starting, BRB": ["starting", "brb"],
  "Feinschliff: Starting, BRB, Ending": ["starting", "brb", "ending"],
  "Feinschliff: Starting, BRB, Ending, Alerts": ["starting", "brb", "ending", "alerts"],
  "Feinschliff: Starting, BRB, Ending, Befehlsseite": ["starting", "brb", "ending", "info"],
  "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Befehlsseite": ["starting", "brb", "ending", "cam", "info"],
  "Feinschliff: Starting, BRB, Ending, Kamera-Rahmen, Effekte": ["starting", "brb", "ending", "cam", "fx"],
  "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik": ["starting", "brb", "ending", "alerts", "cam", "music"],
  "Feinschliff: Alerts": ["alerts"],
  "Feinschliff: Chat": ["chat"],
  "Feinschliff: Chat, Musik": ["chat", "music"],
  "Feinschliff: Chat, Musik, Effekte": ["chat", "music", "fx"],
  "Feinschliff: Kamera-Rahmen": ["cam"],
  "Feinschliff: Musik": ["music"],
  "Feinschliff: Effekte": ["fx"],
  "Feinschliff: Befehlsseite": ["info"],
  "Feinschliff: Minimes": ["minimes"],
};
