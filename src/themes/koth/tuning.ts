// Fine-tuning fields of the King of the Hill theme: every visible value of its scenes as its own field (sizes, gaps, angles,
// durations, the color and font of each text, the share of shared values per use), one file per group in tuning/.
// Colors and fonts stay empty and follow the theme value until the streamer sets one (inherits). The CSS reads them
// as var(--key). The Rust mirror is generated: node scripts/tuning.ts.
import type { SceneName, SettingField } from "../../core/theme.ts";
import { ALERTS_TUNING } from "./tuning/alerts.ts";
import { CAM_TUNING } from "./tuning/cam.ts";
import { CHAT_TUNING } from "./tuning/chat.ts";
import { FX_TUNING } from "./tuning/fx.ts";
import { GENERAL_TUNING } from "./tuning/general.ts";
import { HILL_TUNING } from "./tuning/hill.ts";
import { INFO_TUNING } from "./tuning/info.ts";
import { MINIMES_TUNING } from "./tuning/minimes.ts";
import { MUSIC_TUNING } from "./tuning/music.ts";
import { OFFLINE_BANNER_TUNING } from "./tuning/offlineBanner.ts";
import { PROFILE_BANNER_TUNING } from "./tuning/profileBanner.ts";
import { REPORT_TUNING } from "./tuning/report.ts";
import { SCREENS_TUNING } from "./tuning/screens.ts";
import { STARTING_TUNING } from "./tuning/starting.ts";
import { STINGER_TUNING } from "./tuning/stinger.ts";
import { WORLD_TUNING } from "./tuning/world.ts";

// typed as plain fields: the values type comes generated from the server (src/generated/themes), and the literal
// types of hundreds of fields are too much for the compiler
export const TUNING_FIELDS: readonly SettingField[] = ([] as readonly SettingField[]).concat(MINIMES_TUNING, GENERAL_TUNING, HILL_TUNING, SCREENS_TUNING, ALERTS_TUNING, CHAT_TUNING, CAM_TUNING, MUSIC_TUNING, FX_TUNING, INFO_TUNING, STARTING_TUNING, REPORT_TUNING, WORLD_TUNING, STINGER_TUNING, PROFILE_BANNER_TUNING, OFFLINE_BANNER_TUNING);

export const TUNING_GROUPS: Readonly<Record<string, readonly SceneName[]>> = {
  "Feinschliff: Minimes": ["minimes"],
  "Feinschliff: Allgemein": ["starting", "brb", "ending", "alerts", "chat", "cam", "music", "stats", "fx", "minimes", "info"],
  "Feinschliff: Hügel": ["starting", "brb", "ending", "info"],
  "Feinschliff: Starting, BRB, Ending": ["starting", "brb", "ending"],
  "Feinschliff: Alerts": ["alerts"],
  "Feinschliff: Chat": ["chat"],
  "Feinschliff: Kamera-Rahmen": ["cam"],
  "Feinschliff: Musik": ["music"],
  "Feinschliff: Effekte": ["fx"],
  "Feinschliff: Befehlsseite": ["info"],
  "Feinschliff: Starting": ["starting"],
  "Feinschliff: Missionsbericht": ["ending", "stats"],
  "Feinschliff: Welt": ["starting", "brb", "ending"],
};
