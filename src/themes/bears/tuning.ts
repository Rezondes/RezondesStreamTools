// Fine-tuning fields of the Bärenbande theme: every visible value of its scenes as its own field (sizes, gaps, angles,
// durations, the color and font of each text, the share of shared values per use), one file per group in tuning/.
// Each group holds the fields of exactly the scenes they change, so a scene page shows only what changes it; fields of
// every scene are on the general page. Colors and fonts stay empty and follow the theme value until the streamer sets
// one (inherits). The CSS reads them as var(--key). The Rust mirror is generated: node scripts/tuning.ts.
import type { SceneName, SettingField } from "../../core/theme.ts";
import { ALERTS_TUNING } from "./tuning/alerts.ts";
import { ALERTS_CAM_MUSIC_TUNING } from "./tuning/alertsCamMusic.ts";
import { ALERTS_CHAT_CAM_MUSIC_INFO_MINIMES_TUNING } from "./tuning/alertsChatCamMusicInfoMinimes.ts";
import { ALERTS_CHAT_MUSIC_FX_TUNING } from "./tuning/alertsChatMusicFx.ts";
import { ALERTS_FX_TUNING } from "./tuning/alertsFx.ts";
import { BRB_TUNING } from "./tuning/brb.ts";
import { CAM_TUNING } from "./tuning/cam.ts";
import { CHAT_TUNING } from "./tuning/chat.ts";
import { ENDING_TUNING } from "./tuning/ending.ts";
import { ENDING_ALERTS_CHAT_CAM_MUSIC_FX_INFO_MINIMES_TUNING } from "./tuning/endingAlertsChatCamMusicFxInfoMinimes.ts";
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
import { STARTING_BRB_ENDING_ALERTS_CAM_MUSIC_INFO_TUNING } from "./tuning/startingBrbEndingAlertsCamMusicInfo.ts";
import { STARTING_BRB_ENDING_ALERTS_CHAT_CAM_MUSIC_FX_TUNING } from "./tuning/startingBrbEndingAlertsChatCamMusicFx.ts";
import { STARTING_BRB_ENDING_ALERTS_CHAT_CAM_MUSIC_FX_INFO_TUNING } from "./tuning/startingBrbEndingAlertsChatCamMusicFxInfo.ts";
import { STARTING_BRB_ENDING_ALERTS_FX_TUNING } from "./tuning/startingBrbEndingAlertsFx.ts";
import { STARTING_BRB_ENDING_ALERTS_MUSIC_FX_INFO_TUNING } from "./tuning/startingBrbEndingAlertsMusicFxInfo.ts";
import { STARTING_BRB_ENDING_INFO_TUNING } from "./tuning/startingBrbEndingInfo.ts";
import { STARTING_BRB_ENDING_MUSIC_TUNING } from "./tuning/startingBrbEndingMusic.ts";
import { STINGER_TUNING } from "./tuning/stinger.ts";

// typed as plain fields: the values type comes generated from the server (src/generated/themes), and the literal
// types of hundreds of fields are too much for the compiler
export const TUNING_FIELDS: readonly SettingField[] = ([] as readonly SettingField[]).concat(STARTING_TUNING, STARTING_BRB_TUNING, STARTING_BRB_ENDING_TUNING, STARTING_BRB_ENDING_INFO_TUNING, STARTING_BRB_ENDING_MUSIC_TUNING, STARTING_BRB_ENDING_ALERTS_FX_TUNING, STARTING_BRB_ENDING_ALERTS_CAM_MUSIC_INFO_TUNING, STARTING_BRB_ENDING_ALERTS_MUSIC_FX_INFO_TUNING, STARTING_BRB_ENDING_ALERTS_CHAT_CAM_MUSIC_FX_TUNING, STARTING_BRB_ENDING_ALERTS_CHAT_CAM_MUSIC_FX_INFO_TUNING, BRB_TUNING, ENDING_TUNING, ENDING_ALERTS_CHAT_CAM_MUSIC_FX_INFO_MINIMES_TUNING, ALERTS_TUNING, ALERTS_FX_TUNING, ALERTS_CAM_MUSIC_TUNING, ALERTS_CHAT_MUSIC_FX_TUNING, ALERTS_CHAT_CAM_MUSIC_INFO_MINIMES_TUNING, CHAT_TUNING, CAM_TUNING, MUSIC_TUNING, FX_TUNING, INFO_TUNING, MINIMES_TUNING, OFFLINE_BANNER_TUNING, PROFILE_BANNER_TUNING, STINGER_TUNING, GENERAL_TUNING);

export const TUNING_GROUPS: Readonly<Record<string, readonly SceneName[]>> = {
  "Feinschliff: Starting": ["starting"],
  "Feinschliff: Starting, BRB": ["starting", "brb"],
  "Feinschliff: Starting, BRB, Ending": ["starting", "brb", "ending"],
  "Feinschliff: Starting, BRB, Ending, Befehlsseite": ["starting", "brb", "ending", "info"],
  "Feinschliff: Starting, BRB, Ending, Musik": ["starting", "brb", "ending", "music"],
  "Feinschliff: Starting, BRB, Ending, Alerts, Effekte": ["starting", "brb", "ending", "alerts", "fx"],
  "Feinschliff: Starting, BRB, Ending, Alerts, Kamera-Rahmen, Musik, Befehlsseite": ["starting", "brb", "ending", "alerts", "cam", "music", "info"],
  "Feinschliff: Starting, BRB, Ending, Alerts, Musik, Effekte, Befehlsseite": ["starting", "brb", "ending", "alerts", "music", "fx", "info"],
  "Feinschliff: Starting, BRB, Ending, Alerts, Chat, Kamera-Rahmen, Musik, Effekte": ["starting", "brb", "ending", "alerts", "chat", "cam", "music", "fx"],
  "Feinschliff: Starting, BRB, Ending, Alerts, Chat, Kamera-Rahmen, Musik, Effekte, Befehlsseite": ["starting", "brb", "ending", "alerts", "chat", "cam", "music", "fx", "info"],
  "Feinschliff: BRB": ["brb"],
  "Feinschliff: Ending": ["ending"],
  "Feinschliff: Ending, Alerts, Chat, Kamera-Rahmen, Musik, Effekte, Befehlsseite, Minimes": ["ending", "alerts", "chat", "cam", "music", "fx", "info", "minimes"],
  "Feinschliff: Alerts": ["alerts"],
  "Feinschliff: Alerts, Effekte": ["alerts", "fx"],
  "Feinschliff: Alerts, Kamera-Rahmen, Musik": ["alerts", "cam", "music"],
  "Feinschliff: Alerts, Chat, Musik, Effekte": ["alerts", "chat", "music", "fx"],
  "Feinschliff: Alerts, Chat, Kamera-Rahmen, Musik, Befehlsseite, Minimes": ["alerts", "chat", "cam", "music", "info", "minimes"],
  "Feinschliff: Chat": ["chat"],
  "Feinschliff: Kamera-Rahmen": ["cam"],
  "Feinschliff: Musik": ["music"],
  "Feinschliff: Effekte": ["fx"],
  "Feinschliff: Befehlsseite": ["info"],
  "Feinschliff: Minimes": ["minimes"],
};
