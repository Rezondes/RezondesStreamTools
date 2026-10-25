// Theme interface: which scenes exist, how a theme describes its settings and what a theme has to
// provide (ThemeModule without React for server and dashboard, ThemeView with the scenes for the overlays).
import type { ComponentType } from "react";
import type { OptionsBy } from "../generated/OptionsBy.ts";
import type { SceneName } from "../generated/SceneName.ts";
import type { SettingValue } from "../generated/SettingValue.ts";
import type { SoundValue } from "../generated/SoundValue.ts";
import type { PanelDesign } from "./panels.ts";
import type { RenderClip } from "./renderClip.ts";

// info: public commands page for viewers (/s/<login>/), not a source for OBS
export const SCENES = ["starting", "brb", "ending", "alerts", "chat", "cam", "music", "stats", "fx", "minimes", "info"] as const satisfies readonly SceneName[];
export type { SceneName } from "../generated/SceneName.ts";
export const OBS_SCENES = SCENES.filter(scene => scene !== "info");

// Size of the browser source in OBS when the theme does not say otherwise (ThemeModule.areas, src/core/sceneArea.ts)
export const SCENE_SIZES: Record<SceneName, { width: number; height: number }> = {
  starting: { width: 1920, height: 1080 },
  brb: { width: 1920, height: 1080 },
  ending: { width: 1920, height: 1080 },
  alerts: { width: 1920, height: 1080 },
  chat: { width: 500, height: 900 },
  cam: { width: 640, height: 360 },
  music: { width: 900, height: 240 },
  stats: { width: 960, height: 540 },
  fx: { width: 1920, height: 1080 },
  minimes: { width: 1920, height: 360 },
  info: { width: 1280, height: 900 },
};

// Sound: own file from the media (file) or empty = built-in sound of the theme; volume 0 to 1
export type { SoundValue } from "../generated/SoundValue.ts";
export type { SettingValue } from "../generated/SettingValue.ts";
export type SettingValues = Record<string, SettingValue>;

type FieldBase = {
  key: string;
  label: string;
  group: string; // section in the form
  scene?: SceneName; // for the preview in the dashboard
  basic?: boolean; // shown in the simple view of the dashboard
  inherit?: string; // key of the field whose value applies while this one is empty (""), e.g. a text color of the accent
};

export type SettingField =
  | (FieldBase & { type: "color"; default: string })
  // ascii: the dashboard offers the ASCII logo generator for it
  | (FieldBase & { type: "text" | "textarea"; default: string; maxLength?: number; ascii?: boolean })
  | (FieldBase & { type: "lines"; default: readonly string[]; maxLines?: number })
  | (FieldBase & { type: "number"; default: number; min: number; max: number; step?: number; unit?: "px" | "ms" | "s" | "%" })
  | (FieldBase & { type: "boolean"; default: boolean })
  // optionsBy: the dashboard offers only the options for the value of another field (a coat for a breed); options
  // holds all of them, so every one stays valid
  | (FieldBase & { type: "select" | "font"; default: string; options: readonly string[]; optionsBy?: OptionsBy })
  | (FieldBase & { type: "media"; default: string; accept: "image" | "video" | "audio" })
  | (FieldBase & { type: "sound"; default: SoundValue });

// groupScenes: in which scenes a group has an effect (the dashboard only shows the groups of the scene in the preview);
// if a group is missing, it applies everywhere (general), [] = in no scene (stinger, banners: render section)
// Minime variants of a theme (e.g. fruits) instead of colors: command to choose (default word), label in the
// dashboard and per variant id (lower case letters and digits), name and default names in chat. The same shape holds
// the factions of a theme; color: default color of a faction
type MinimeVariantInfo = { id: string; label: string; names: readonly string[]; color?: string };
export type MinimeVariantSet = { command: string; label: string; variants: readonly MinimeVariantInfo[] };

// minimeVariants: variants of the minimes; if missing, chatters choose colors (see src/core/minimeFields.ts).
// minimeTeams: factions of the minimes, only together with minimeVariants (the variants are the roles)
// personalize: values the theme fills with the streamer's Twitch login on first login (channel name, logo, ...),
// instead of general samples; if missing, the defaults apply
export type ThemeSchema = {
  id: string;
  name: string;
  fields: readonly SettingField[];
  groupScenes?: Readonly<Record<string, readonly SceneName[]>>;
  personalize?: (login: string) => SettingValues;
  minimeVariants?: MinimeVariantSet;
  minimeTeams?: MinimeVariantSet;
};

// Contract of a theme, data side (without React, also for the server): its schema and the clips for stinger and banners
// (render section), computed from the values resolved against the schema. Registered in src/themes/registry.ts.
// panel: the template of a new Twitch panel in the theme's look (panel designer, src/core/panels.ts)
// areas: the size of the OBS source per scene, computed from the values, so nothing is cut off and nothing is larger
// than needed; a scene the theme leaves out gets SCENE_SIZES
export type ThemeModule = {
  schema: ThemeSchema;
  clips: (values: SettingValues, login: string) => RenderClip[];
  panel: (values: SettingValues, title: string) => PanelDesign;
  areas?: (values: SettingValues) => Partial<Record<SceneName, SceneArea>>;
};

// Size of the OBS source of a scene. Without offset the scene fills its source. With offset the scene is drawn on the
// 1920x1080 stage and the source shows only the part whose top left corner sits at offset (alerts: the card and the
// room for its effects).
export type SceneArea = { width: number; height: number; offset?: { x: number; y: number } };

// Contract of a theme, view: its scenes (React.lazy), id equal to schema.id. Registered in src/themes/scenes.tsx.
// Missing scenes come from the standard theme, except theme-specific features (src/core/themeRuntime.ts).
export type ThemeView = { id: string; scenes: Partial<Record<SceneName, ComponentType>> };
