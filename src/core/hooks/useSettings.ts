// Hook: chosen theme and settings of the streamer. null until /s/<login>/settings is loaded; without a streamer
// or server fallback applies (defaults). Changes from the dashboard arrive immediately (SSE "settings").
// With ?preview (preview in the dashboard, as iframe or in its own tab) unsaved values arrive via a
// BroadcastChannel that only pages of the same origin in the same browser can reach. A downloaded scene (offline.ts)
// has its settings in the file and asks nothing.
// useThemeValues reads the values in a scene from the context that main.tsx sets.
import { createContext, useContext, useEffect, useState } from "react";
import { connect, fetchSettings } from "../connection.ts";
import { offline } from "../offline.ts";
import { params } from "../params.ts";
import type { SettingValues } from "../theme.ts";
import type { PublicSettings } from "../types.ts";

// Channel between dashboard and preview: ready = a scene is listening, settings = new values for the scenes
export const PREVIEW = { channel: "rezondes-preview", ready: "ready", settings: "settings" } as const;

// live: false = load only once, no SSE connection (public commands page: visitors are not overlays)
export function useSettings(fallback: PublicSettings, live = true): PublicSettings | null {
  const [settings, setSettings] = useState<PublicSettings | null>(offline?.settings ?? null);
  useEffect(() => {
    if (offline) return;
    let active = true;
    // fetchSettings catches network errors itself and then returns null; an SSE message can be faster
    fetchSettings()
      .then(loaded => { if (active) setSettings(current => current ?? loaded ?? fallback); })
      .catch((error: unknown) => console.warn("Loading settings failed:", error));
    const stop = live ? connect({ settings: setSettings }) : () => {};
    return () => { active = false; stop(); };
  }, [fallback, live]);

  useEffect(() => {
    if (!params.has("preview")) return;
    const channel = new BroadcastChannel(PREVIEW.channel);
    channel.onmessage = (event: MessageEvent) => {
      const data = event.data as { type?: unknown; settings?: PublicSettings } | null;
      if (data?.type === PREVIEW.settings && data.settings) setSettings(data.settings);
    };
    channel.postMessage({ type: PREVIEW.ready });
    return () => channel.close();
  }, []);

  return settings;
}

export const ThemeValues = createContext<SettingValues>({});

export const useThemeValues = () => useContext(ThemeValues);
