// Fine-tuning fields of the Plantage theme: every visible value of its scenes as its own field (sizes, gaps, angles,
// durations, the color and font of each text, the share of shared values per use), one file per group in tuning/.
// Colors and fonts stay empty and follow the theme value until the streamer sets one (inherits). The CSS reads them
// as var(--key). The Rust mirror is generated: node scripts/tuning.ts.
import type { SceneName, SettingField } from "../../core/theme.ts";
import { ALERTS_TUNING } from "./tuning/alerts.ts";
import { CAM_TUNING } from "./tuning/cam.ts";
import { CHAT_TUNING } from "./tuning/chat.ts";
import { FIELD_TUNING } from "./tuning/field.ts";
import { FX_TUNING } from "./tuning/fx.ts";
import { GENERAL_TUNING } from "./tuning/general.ts";
import { INFO_TUNING } from "./tuning/info.ts";
import { MINIMES_TUNING } from "./tuning/minimes.ts";
import { MUSIC_TUNING } from "./tuning/music.ts";
import { OFFLINE_BANNER_TUNING } from "./tuning/offlineBanner.ts";
import { PROFILE_BANNER_TUNING } from "./tuning/profileBanner.ts";
import { SCREENS_TUNING } from "./tuning/screens.ts";
import { STINGER_TUNING } from "./tuning/stinger.ts";

// typed as plain fields: the values type comes generated from the server (src/generated/themes), and the literal
// types of hundreds of fields are too much for the compiler
export const TUNING_FIELDS: readonly SettingField[] = ([] as readonly SettingField[]).concat(MINIMES_TUNING, GENERAL_TUNING, FIELD_TUNING, SCREENS_TUNING, ALERTS_TUNING, FX_TUNING, CHAT_TUNING, CAM_TUNING, MUSIC_TUNING, INFO_TUNING, STINGER_TUNING, PROFILE_BANNER_TUNING, OFFLINE_BANNER_TUNING);

export const TUNING_GROUPS: Readonly<Record<string, readonly SceneName[]>> = {
  "Feinschliff: Minimes": ["minimes"],
  "Feinschliff: Allgemein": ["starting", "brb", "ending", "alerts", "chat", "cam", "music", "stats", "fx", "minimes", "info"],
  "Feinschliff: Plantage": ["starting", "brb", "ending", "info"],
  "Feinschliff: Starting, BRB, Ending": ["starting", "brb", "ending"],
  "Feinschliff: Alerts": ["alerts"],
  "Feinschliff: Effekte": ["fx"],
  "Feinschliff: Chat": ["chat"],
  "Feinschliff: Kamera-Rahmen": ["cam"],
  "Feinschliff: Musik": ["music"],
  "Feinschliff: Befehlsseite": ["info"],
};
