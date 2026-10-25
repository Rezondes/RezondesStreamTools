// Fine-tuning fields of the Matrix theme: every visible value of its scenes as its own field (sizes, gaps, angles,
// durations, the color and font of each text, the share of shared values per use), one file per group in tuning/.
// Colors and fonts stay empty and follow the theme value until the streamer sets one (inherits). The CSS reads them
// as var(--key). The Rust mirror is generated: node scripts/tuning.ts.
import type { SceneName, SettingField } from "../../core/theme.ts";
import { ALERTS_TUNING } from "./tuning/alerts.ts";
import { CAM_TUNING } from "./tuning/cam.ts";
import { CHAT_TUNING } from "./tuning/chat.ts";
import { CRT_TUNING } from "./tuning/crt.ts";
import { FX_TUNING } from "./tuning/fx.ts";
import { GENERAL_TUNING } from "./tuning/general.ts";
import { INFO_TUNING } from "./tuning/info.ts";
import { MINIMES_TUNING } from "./tuning/minimes.ts";
import { MUSIC_TUNING } from "./tuning/music.ts";
import { OFFLINE_BANNER_TUNING } from "./tuning/offlineBanner.ts";
import { PROFILE_BANNER_TUNING } from "./tuning/profileBanner.ts";
import { RAIN_TUNING } from "./tuning/rain.ts";
import { SCREENS_TUNING } from "./tuning/screens.ts";
import { STATS_TUNING } from "./tuning/stats.ts";
import { STINGER_TUNING } from "./tuning/stinger.ts";

// typed as plain fields: the values type comes generated from the server (src/generated/themes), and the literal
// types of hundreds of fields are too much for the compiler
export const TUNING_FIELDS: readonly SettingField[] = [...MINIMES_TUNING, ...GENERAL_TUNING, ...ALERTS_TUNING, ...CAM_TUNING, ...SCREENS_TUNING, ...STATS_TUNING, ...MUSIC_TUNING, ...CHAT_TUNING, ...FX_TUNING, ...INFO_TUNING, ...RAIN_TUNING, ...CRT_TUNING, ...STINGER_TUNING, ...PROFILE_BANNER_TUNING, ...OFFLINE_BANNER_TUNING];

export const TUNING_GROUPS: Readonly<Record<string, readonly SceneName[]>> = {
  "Feinschliff: Minimes": ["minimes"],
  "Feinschliff: Alerts": ["alerts"],
  "Feinschliff: Kamera-Rahmen": ["cam"],
  "Feinschliff: Starting, BRB, Ending": ["starting", "brb", "ending"],
  "Feinschliff: Statistik": ["stats"],
  "Feinschliff: Musik": ["music"],
  "Feinschliff: Chat": ["chat"],
  "Feinschliff: Effekte": ["fx"],
  "Feinschliff: Befehlsseite": ["info"],
  "Feinschliff: Matrix-Regen": ["starting", "brb", "ending", "alerts", "info"],
  "Feinschliff: Röhre": ["starting", "brb", "ending", "alerts", "chat", "cam", "music", "fx", "info"],
};
