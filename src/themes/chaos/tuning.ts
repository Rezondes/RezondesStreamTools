// Fine-tuning fields of the Chaos theme: every visible value of its scenes as its own field (sizes, gaps, angles,
// durations, the color and font of each text, the share of shared values per use), one file per group in tuning/.
// Colors and fonts stay empty and follow the theme value until the streamer sets one (inherits). The CSS reads them
// as var(--key). The Rust mirror is generated: node scripts/tuning.ts.
import type { SceneName, SettingField } from "../../core/theme.ts";
import { ALERTS_TUNING } from "./tuning/alerts.ts";
import { CAM_TUNING } from "./tuning/cam.ts";
import { CHAT_TUNING } from "./tuning/chat.ts";
import { FX_TUNING } from "./tuning/fx.ts";
import { GENERAL_TUNING } from "./tuning/general.ts";
import { INFO_TUNING } from "./tuning/info.ts";
import { MINIMES_TUNING } from "./tuning/minimes.ts";
import { MUSIC_TUNING } from "./tuning/music.ts";
import { NOTES_TUNING } from "./tuning/notes.ts";
import { OFFLINE_BANNER_TUNING } from "./tuning/offlineBanner.ts";
import { PROFILE_BANNER_TUNING } from "./tuning/profileBanner.ts";
import { SCREENS_TUNING } from "./tuning/screens.ts";
import { STINGER_TUNING } from "./tuning/stinger.ts";
import { WALL_TUNING } from "./tuning/wall.ts";

// typed as plain fields: the values type comes generated from the server (src/generated/themes), and the literal
// types of hundreds of fields are too much for the compiler
export const TUNING_FIELDS: readonly SettingField[] = ([] as readonly SettingField[]).concat(MINIMES_TUNING, GENERAL_TUNING, WALL_TUNING, CAM_TUNING, ALERTS_TUNING, SCREENS_TUNING, NOTES_TUNING, CHAT_TUNING, MUSIC_TUNING, FX_TUNING, INFO_TUNING, STINGER_TUNING, PROFILE_BANNER_TUNING, OFFLINE_BANNER_TUNING);

export const TUNING_GROUPS: Readonly<Record<string, readonly SceneName[]>> = {
  "Feinschliff: Minimes": ["minimes"],
  "Feinschliff: Allgemein": ["starting", "brb", "ending", "alerts", "chat", "cam", "music", "stats", "fx", "minimes", "info"],
  "Feinschliff: Wand": ["starting", "brb", "ending", "info", "alerts"],
  "Feinschliff: Kamera-Rahmen": ["cam"],
  "Feinschliff: Alerts": ["alerts"],
  "Feinschliff: Starting, BRB, Ending": ["starting", "brb", "ending"],
  "Feinschliff: Notizzettel": ["starting", "brb", "ending", "alerts", "chat", "cam", "music", "stats", "fx", "minimes", "info"],
  "Feinschliff: Chat": ["chat"],
  "Feinschliff: Musik": ["music"],
  "Feinschliff: Effekte": ["fx"],
  "Feinschliff: Befehlsseite": ["info"],
};
