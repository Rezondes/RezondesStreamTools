// Fine-tuning fields of the Standard theme: every visible value of its scenes as its own field (sizes, gaps, angles,
// durations, the color and font of each text, the share of shared values per use), one file per group in tuning/.
// Colors and fonts stay empty and follow the theme value until the streamer sets one (inherits). The CSS reads them
// as var(--key). The Rust mirror is generated: node scripts/tuning.ts.
import type { SceneName, SettingField } from "../../core/theme.ts";
import { ALERTS_TUNING } from "./tuning/alerts.ts";
import { BACKGROUND_TUNING } from "./tuning/background.ts";
import { CAM_TUNING } from "./tuning/cam.ts";
import { CHAT_TUNING } from "./tuning/chat.ts";
import { FX_TUNING } from "./tuning/fx.ts";
import { GENERAL_TUNING } from "./tuning/general.ts";
import { INFO_TUNING } from "./tuning/info.ts";
import { MUSIC_TUNING } from "./tuning/music.ts";
import { OFFLINE_BANNER_TUNING } from "./tuning/offlineBanner.ts";
import { PROFILE_BANNER_TUNING } from "./tuning/profileBanner.ts";
import { SCREENS_TUNING } from "./tuning/screens.ts";
import { STATS_TUNING } from "./tuning/stats.ts";
import { STINGER_TUNING } from "./tuning/stinger.ts";

export const TUNING_FIELDS = [...GENERAL_TUNING, ...SCREENS_TUNING, ...STATS_TUNING, ...ALERTS_TUNING, ...CHAT_TUNING, ...CAM_TUNING, ...MUSIC_TUNING, ...FX_TUNING, ...INFO_TUNING, ...BACKGROUND_TUNING, ...STINGER_TUNING, ...PROFILE_BANNER_TUNING, ...OFFLINE_BANNER_TUNING] as const satisfies readonly SettingField[];

export const TUNING_GROUPS: Readonly<Record<string, readonly SceneName[]>> = {
  "Feinschliff: Starting, BRB, Ending": ["starting", "brb", "ending"],
  "Feinschliff: Statistik": ["ending", "stats"],
  "Feinschliff: Alerts": ["alerts"],
  "Feinschliff: Chat": ["chat"],
  "Feinschliff: Kamera-Rahmen": ["cam"],
  "Feinschliff: Musik": ["music"],
  "Feinschliff: Effekte": ["fx"],
  "Feinschliff: Befehlsseite": ["info"],
  "Feinschliff: Hintergrund": ["starting", "brb", "ending"],
};
