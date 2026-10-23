// A scene downloaded as a single HTML file (the dashboard builds it, src/dashboard/offlineHtml.ts) carries its scene,
// the settings and the media files it uses in window.RST_OFFLINE. Such a page asks no server: no live data, the
// settings and media come from the file. Check: offline.check.ts.
import type { SceneName } from "./theme.ts";
import type { PublicSettings } from "./types.ts";

// media: file name in the media folder -> data URL
export type OfflinePage = { scene: SceneName; settings: PublicSettings; media: Record<string, string> };

// The page of a downloaded file, null for every page served by the server
export const offlinePageOf = (global: object): OfflinePage | null => (global as { RST_OFFLINE?: OfflinePage }).RST_OFFLINE ?? null;

export const offline = offlinePageOf(globalThis);
