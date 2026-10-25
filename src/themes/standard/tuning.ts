// Fine-tuning fields of the Standard theme: every visible value of its scenes as its own field (sizes, gaps, angles,
// durations, the color and font of each text, the share of shared values per use), one file per group in tuning/.
// Each group holds the fields of exactly the scenes they change, so a scene page shows only what changes it; fields of
// every scene are on the general page. Colors and fonts stay empty and follow the theme value until the streamer sets
// one (inherits). The CSS reads them as var(--key). The Rust mirror is generated: node scripts/tuning.ts.
import type { SceneName, SettingField } from "../../core/theme.ts";
import { ALERTS_TUNING } from "./tuning/alerts.ts";
import { BRB_TUNING } from "./tuning/brb.ts";
import { CAM_TUNING } from "./tuning/cam.ts";
import { CHAT_TUNING } from "./tuning/chat.ts";
import { CHAT_INFO_TUNING } from "./tuning/chatInfo.ts";
import { CHAT_MUSIC_FX_INFO_TUNING } from "./tuning/chatMusicFxInfo.ts";
import { FX_TUNING } from "./tuning/fx.ts";
import { GENERAL_TUNING } from "./tuning/general.ts";
import { INFO_TUNING } from "./tuning/info.ts";
import { MUSIC_TUNING } from "./tuning/music.ts";
import { MUSIC_INFO_TUNING } from "./tuning/musicInfo.ts";
import { OFFLINE_BANNER_TUNING } from "./tuning/offlineBanner.ts";
import { PROFILE_BANNER_TUNING } from "./tuning/profileBanner.ts";
import { STARTING_TUNING } from "./tuning/starting.ts";
import { STARTING_BRB_TUNING } from "./tuning/startingBrb.ts";
import { STARTING_BRB_ENDING_TUNING } from "./tuning/startingBrbEnding.ts";
import { STARTING_BRB_ENDING_MUSIC_INFO_TUNING } from "./tuning/startingBrbEndingMusicInfo.ts";
import { STATS_TUNING } from "./tuning/stats.ts";
import { STINGER_TUNING } from "./tuning/stinger.ts";

// typed as plain fields: the values type comes generated from the server (src/generated/themes), and the literal
// types of hundreds of fields are too much for the compiler
export const TUNING_FIELDS: readonly SettingField[] = ([] as readonly SettingField[]).concat(STARTING_TUNING, STARTING_BRB_TUNING, STARTING_BRB_ENDING_TUNING, STARTING_BRB_ENDING_MUSIC_INFO_TUNING, BRB_TUNING, STATS_TUNING, ALERTS_TUNING, CHAT_TUNING, CHAT_INFO_TUNING, CHAT_MUSIC_FX_INFO_TUNING, CAM_TUNING, MUSIC_TUNING, MUSIC_INFO_TUNING, FX_TUNING, INFO_TUNING, OFFLINE_BANNER_TUNING, PROFILE_BANNER_TUNING, STINGER_TUNING, GENERAL_TUNING);

export const TUNING_GROUPS: Readonly<Record<string, readonly SceneName[]>> = {
  "Feinschliff: Starting": ["starting"],
  "Feinschliff: Starting, BRB": ["starting", "brb"],
  "Feinschliff: Starting, BRB, Ending": ["starting", "brb", "ending"],
  "Feinschliff: Starting, BRB, Ending, Musik, Befehlsseite": ["starting", "brb", "ending", "music", "info"],
  "Feinschliff: BRB": ["brb"],
  "Feinschliff: Statistik": ["stats"],
  "Feinschliff: Alerts": ["alerts"],
  "Feinschliff: Chat": ["chat"],
  "Feinschliff: Chat, Befehlsseite": ["chat", "info"],
  "Feinschliff: Chat, Musik, Effekte, Befehlsseite": ["chat", "music", "fx", "info"],
  "Feinschliff: Kamera-Rahmen": ["cam"],
  "Feinschliff: Musik": ["music"],
  "Feinschliff: Musik, Befehlsseite": ["music", "info"],
  "Feinschliff: Effekte": ["fx"],
  "Feinschliff: Befehlsseite": ["info"],
};
