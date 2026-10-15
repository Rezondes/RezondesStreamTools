// "In OBS importieren" auf drei Wegen mit derselben Aufteilung: Starting, BRB und Ending je eine eigene Szene,
// alle übrigen Overlays zusammen in einer Szene, die man als Quelle in die eigenen Szenen legt.
// 1. Ziehen: Link mit layer-name/-width/-height, OBS legt beim Ablegen die Browserquelle an.
// 2. Datei: Szenensammlung (JSON) für Szenensammlung > Importieren.
// 3. obs-websocket 5: Anfragen, die fehlende Szenen und Quellen anlegen und vorhandene Quellen aktualisieren.
import { SCENE_SIZES, SCENES, type SceneName } from "../core/theme.ts";

export type ObsSource = { scene: SceneName; name: string; url: string; width: number; height: number };
export type ObsScene = { name: string; sources: ObsSource[] };
export type ObsRequest = { requestType: string; requestData: Record<string, unknown> };

const FULLSCREEN: readonly SceneName[] = ["starting", "brb", "ending"];
// Ausrichtung der Szenenelemente: oben links (OBS_ALIGN_TOP | OBS_ALIGN_LEFT)
const ALIGN_TOP_LEFT = 5;

// base: volle Adresse bis zum Login (https://.../s/<login>); Quellen heissen "<login> <szene>"
export function obsLayout(base: string, login: string, sceneNames: Record<SceneName, string>, overlayScene: string): ObsScene[] {
  const source = (scene: SceneName): ObsSource => ({ scene, name: `${login} ${scene}`, url: `${base}/${scene}`, ...SCENE_SIZES[scene] });
  return [
    ...FULLSCREEN.map(scene => ({ name: sceneNames[scene], sources: [source(scene)] })),
    { name: overlayScene, sources: SCENES.filter(scene => !FULLSCREEN.includes(scene)).map(source) },
  ];
}

// Einstellungen der Browserquelle; Ton läuft über den OBS-Mixer (Alerts, Effekte)
const browserSettings = (source: ObsSource) => ({ url: source.url, width: source.width, height: source.height, reroute_audio: true });

// Link zum Ziehen auf das OBS-Fenster; OBS nimmt die layer-Parameter wieder aus der URL
export function dragUrl(source: ObsSource) {
  const url = new URL(source.url);
  url.searchParams.set("layer-name", source.name);
  url.searchParams.set("layer-width", String(source.width));
  url.searchParams.set("layer-height", String(source.height));
  return url.toString();
}

// Szenensammlung im Format der OBS-Datei; uuid ist injiziert, damit der Check feste Werte bekommt
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

// Anfragen an die laufende Sammlung: fehlende Szenen anlegen, vorhandene Quellen aktualisieren (Position bleibt),
// fehlende Quellen in ihrer Szene anlegen
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
