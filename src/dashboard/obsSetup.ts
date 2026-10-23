// "Import into OBS" in three ways with the same split: Starting, BRB and Ending one scene each,
// all other overlays together in one scene that one puts as a source into their own scenes.
// 1. Dragging: link with layer-name/-width/-height, OBS creates the browser source on drop.
// 2. File: scene collection (JSON) for Scene Collection > Import.
// 3. obs-websocket 5: requests that create missing scenes and sources and update existing sources.
// Every further effect zone the triggers name gets an effects source of its own in the overlay scene.
import { OBS_SCENES, type SceneArea, type SceneName } from "../core/theme.ts";

// x, y: where the source sits on the 1920x1080 canvas; an alert cut out of the stage lands where it was drawn; zone:
// the effect zone of a further effects source (?zone=)
export type ObsSource = { scene: SceneName; name: string; url: string; width: number; height: number; x: number; y: number; zone?: string };
export type ObsScene = { name: string; sources: ObsSource[] };
// place: where the scene item of the source belongs on the canvas (only for sources that do not start at 0, 0)
type ObsRequest = { requestType: string; requestData: Record<string, unknown>; place?: { sceneName: string; x: number; y: number } };

const FULLSCREEN: readonly SceneName[] = ["starting", "brb", "ending"];
// Alignment of the scene items: top left (OBS_ALIGN_TOP | OBS_ALIGN_LEFT)
const ALIGN_TOP_LEFT = 5;

// OBS URL of a scene with the streamer's secret overlay key (without it there are no live events)
export const sceneUrl = (base: string, scene: SceneName, key: string) => `${base}/${scene}?key=${encodeURIComponent(key)}`;

// fixed: the zone of the effects source every theme has; effects without a zone play there
const MAIN_ZONE = "main";

// The further effect zones the actions of the triggers name, each once and sorted
export const fxZones = (triggers: readonly { do: readonly { zone?: string }[] }[]) =>
  [...new Set(triggers.flatMap(trigger => trigger.do.map(action => action.zone ?? MAIN_ZONE)))].filter(zone => zone !== "" && zone !== MAIN_ZONE).sort();

// base: full URL up to the login (https://.../s/<login>); sources are named "<login> <scene>"; key: overlay key;
// areas: size of every source for the values of the active theme (sceneArea.ts); zones: further effect zones (fxZones)
type Names = { scenes: Record<SceneName, string>; overlayScene: string };
export function obsLayout(base: string, login: string, key: string, names: Names, areas: Record<SceneName, SceneArea>, zones: readonly string[] = []): ObsScene[] {
  const source = (scene: SceneName): ObsSource => {
    const { width, height, offset } = areas[scene];
    return { scene, name: `${login} ${scene}`, url: sceneUrl(base, scene, key), width, height, x: offset?.x ?? 0, y: offset?.y ?? 0 };
  };
  const zoneSource = (zone: string): ObsSource => ({ ...source("fx"), name: `${login} fx ${zone}`, url: `${sceneUrl(base, "fx", key)}&zone=${encodeURIComponent(zone)}`, zone });
  const { scenes: sceneNames, overlayScene } = names;
  return [
    ...FULLSCREEN.map(scene => ({ name: sceneNames[scene], sources: [source(scene)] })),
    { name: overlayScene, sources: [...OBS_SCENES.filter(scene => !FULLSCREEN.includes(scene)).map(source), ...zones.map(zoneSource)] },
  ];
}

// Settings of the browser source; sound goes through the OBS mixer (alerts, effects). Starting, BRB and Ending reload
// as soon as their scene becomes active (timer, countdown and animations start from the beginning), and sleep otherwise.
// The other overlays keep running, otherwise alerts and chat would be lost while their scene is not visible.
const browserSettings = (source: ObsSource) => ({
  url: source.url,
  width: source.width,
  height: source.height,
  reroute_audio: true,
  ...(FULLSCREEN.includes(source.scene) ? { restart_when_active: true, shutdown: true } : {}),
});

// Link for dragging onto the OBS window; OBS takes the layer parameters out of the URL again
export function dragUrl(source: ObsSource) {
  const url = new URL(source.url);
  url.searchParams.set("layer-name", source.name);
  url.searchParams.set("layer-width", String(source.width));
  url.searchParams.set("layer-height", String(source.height));
  return url.toString();
}

// Scene collection in the format of the OBS file; uuid is injected so the check gets fixed values
export function sceneCollection(name: string, layout: ObsScene[], uuid: () => string) {
  const inputs = layout.flatMap(scene => scene.sources.map(source => ({ source, uuid: uuid() })));
  const uuidOf = new Map(inputs.map(input => [input.source.name, input.uuid]));
  const scenes = layout.map(scene => ({
    id: "scene",
    versioned_id: "scene",
    name: scene.name,
    uuid: uuid(),
    settings: {
      id_counter: scene.sources.length,
      custom_size: false,
      items: scene.sources.map((source, index) => ({
        name: source.name,
        source_uuid: uuidOf.get(source.name),
        id: index + 1,
        visible: true,
        locked: false,
        pos: { x: source.x, y: source.y },
        scale: { x: 1, y: 1 },
        rot: 0,
        align: ALIGN_TOP_LEFT,
        bounds_type: 0,
      })),
    },
  }));
  return {
    name,
    current_scene: layout[0].name,
    current_program_scene: layout[0].name,
    scene_order: layout.map(scene => ({ name: scene.name })),
    sources: [
      ...inputs.map(({ source, uuid: id }) => ({ id: "browser_source", versioned_id: "browser_source", name: source.name, uuid: id, settings: browserSettings(source), enabled: true, volume: 1, mixers: 255 })),
      ...scenes,
    ],
    groups: [],
    transitions: [],
  };
}

// Requests to the running collection: create missing scenes, update existing sources (a moved one keeps its position),
// create missing sources in their scene; a source that does not start at 0, 0 says where its item belongs
export function obsRequests(layout: ObsScene[], scenes: readonly string[], inputs: readonly string[]): ObsRequest[] {
  return layout.flatMap(scene => [
    ...(scenes.includes(scene.name) ? [] : [{ requestType: "CreateScene", requestData: { sceneName: scene.name } }]),
    ...scene.sources.map(source => {
      const place = source.x || source.y ? { place: { sceneName: scene.name, x: source.x, y: source.y } } : {};
      return inputs.includes(source.name)
        ? { requestType: "SetInputSettings", requestData: { inputName: source.name, inputSettings: browserSettings(source), overlay: true }, ...place }
        : { requestType: "CreateInput", requestData: { sceneName: scene.name, inputName: source.name, inputKind: "browser_source", inputSettings: browserSettings(source), sceneItemEnabled: true }, ...place };
    }),
  ]);
}

// obs-websocket 5: authentication = base64(sha256(base64(sha256(password + salt)) + challenge))
export async function obsAuth(password: string, salt: string, challenge: string) {
  const sha = async (text: string) => {
    const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
    return btoa(String.fromCharCode(...hash));
  };
  return sha((await sha(password + salt)) + challenge);
}
