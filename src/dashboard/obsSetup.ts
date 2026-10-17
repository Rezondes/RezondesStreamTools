// "Import into OBS" in three ways with the same split: Starting, BRB and Ending one scene each,
// all other overlays together in one scene that one puts as a source into their own scenes.
// 1. Dragging: link with layer-name/-width/-height, OBS creates the browser source on drop.
// 2. File: scene collection (JSON) for Scene Collection > Import.
// 3. obs-websocket 5: requests that create missing scenes and sources and update existing sources.
import { OBS_SCENES, SCENE_SIZES, type SceneName } from "../core/theme.ts";

type ObsSource = { scene: SceneName; name: string; url: string; width: number; height: number };
export type ObsScene = { name: string; sources: ObsSource[] };
type ObsRequest = { requestType: string; requestData: Record<string, unknown> };

const FULLSCREEN: readonly SceneName[] = ["starting", "brb", "ending"];
// Alignment of the scene items: top left (OBS_ALIGN_TOP | OBS_ALIGN_LEFT)
const ALIGN_TOP_LEFT = 5;

// OBS URL of a scene with the streamer's secret overlay key (without it there are no live events)
export const sceneUrl = (base: string, scene: SceneName, key: string) => `${base}/${scene}?key=${encodeURIComponent(key)}`;

// base: full URL up to the login (https://.../s/<login>); sources are named "<login> <scene>"; key: overlay key
export function obsLayout(base: string, login: string, key: string, sceneNames: Record<SceneName, string>, overlayScene: string): ObsScene[] {
  const source = (scene: SceneName): ObsSource => ({ scene, name: `${login} ${scene}`, url: sceneUrl(base, scene, key), ...SCENE_SIZES[scene] });
  return [
    ...FULLSCREEN.map(scene => ({ name: sceneNames[scene], sources: [source(scene)] })),
    { name: overlayScene, sources: OBS_SCENES.filter(scene => !FULLSCREEN.includes(scene)).map(source) },
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
        pos: { x: 0, y: 0 },
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

// Requests to the running collection: create missing scenes, update existing sources (position stays),
// create missing sources in their scene
export function obsRequests(layout: ObsScene[], scenes: readonly string[], inputs: readonly string[]): ObsRequest[] {
  return layout.flatMap(scene => [
    ...(scenes.includes(scene.name) ? [] : [{ requestType: "CreateScene", requestData: { sceneName: scene.name } }]),
    ...scene.sources.map(source => (inputs.includes(source.name)
      ? { requestType: "SetInputSettings", requestData: { inputName: source.name, inputSettings: browserSettings(source), overlay: true } }
      : { requestType: "CreateInput", requestData: { sceneName: scene.name, inputName: source.name, inputKind: "browser_source", inputSettings: browserSettings(source), sceneItemEnabled: true } })),
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
