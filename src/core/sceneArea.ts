// Size of the OBS source of every scene (ThemeModule.areas): the dashboard shows it under "OBS einrichten" and in the
// OBS import, the overlay page draws an alert on the stage and shows only its part. Pure apart from the frame the
// overlay page sets once (sceneFrame); check: sceneArea.check.ts.
import { STAGE } from "./screens/screens.ts";
import { SCENE_SIZES, SCENES, type SceneArea, type SceneName, type SettingValues, type ThemeModule } from "./theme.ts";

type Size = { width: number; height: number };

// fixed: distance of a left or right aligned alert to the edge of the stage in px (padding of the alert scenes)
const ALERT_SIDE = 48;

// The area of a scene for the values of a theme; without a theme or without an own area the default size
export function areaOf(module: ThemeModule | null, values: SettingValues, scene: SceneName): SceneArea {
  return module?.areas?.(values)[scene] ?? SCENE_SIZES[scene];
}

// The areas of all scenes at once (OBS import, the table under "OBS einrichten")
export const areasOf = (module: ThemeModule | null, values: SettingValues) =>
  Object.fromEntries(SCENES.map(scene => [scene, areaOf(module, values, scene)])) as Record<SceneName, SceneArea>;

// Room for effects around an alert: the same on every side or per side
type Room = number | { left: number; right: number; top: number; bottom: number };

// Where an alert sits on the stage: aligned left, center or right at top, width x height before scaling, plus room for
// effects. The scale grows from the top edge, from the corner of the alignment (or from the middle with centerOrigin).
export type AlertPlacement = {
  align?: string;
  top: number;
  width: number;
  height: number;
  scale?: number;
  room: Room;
  side?: number;
  centerOrigin?: boolean;
};

// The part of the stage an alert needs, cut to the stage (what reached beyond it was never visible)
export function alertArea({ align = "center", top, width, height, scale = 1, room, side = ALERT_SIDE, centerOrigin = false }: AlertPlacement): SceneArea {
  const left = align === "left" ? side : align === "right" ? STAGE.width - side - width : (STAGE.width - width) / 2;
  const origin = centerOrigin || align === "center" ? left + width / 2 : align === "left" ? left : left + width;
  const shown = origin - (origin - left) * scale;
  const around = typeof room === "number" ? { left: room, right: room, top: room, bottom: room } : room;
  const x = Math.max(0, Math.floor(shown - around.left));
  const y = Math.max(0, Math.floor(top - around.top));
  const right = Math.min(STAGE.width, Math.ceil(shown + width * scale + around.right));
  const bottom = Math.min(STAGE.height, Math.ceil(top + height * scale + around.bottom));
  return { width: Math.max(1, right - x), height: Math.max(1, bottom - y), offset: { x, y } };
}

// The frame a scene lays itself out in: the stage for a scene with offset, otherwise the window (the OBS source)
let frame: Size | null = null;
export const setSceneFrame = (size: Size | null) => { frame = size; };
export const sceneFrame = (): Size => frame ?? { width: innerWidth, height: innerHeight };
