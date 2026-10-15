// Hook: gewähltes Theme und Einstellungen des Streamers. null, bis /s/<login>/settings geladen ist; ohne Streamer
// oder Server gilt fallback (Standardwerte). Änderungen aus dem Dashboard kommen sofort an (SSE "settings").
// Mit ?preview (Vorschau im Dashboard) kommen ungespeicherte Werte per postMessage, nur von derselben Herkunft.
// useThemeValues liest die Werte in einer Szene aus dem Kontext, den main.tsx setzt.
import { createContext, useContext, useEffect, useState } from "react";
import { connect, fetchSettings } from "../connection.ts";
import { params } from "../params.ts";
import type { SettingValues } from "../theme.ts";
import type { PublicSettings } from "../types.ts";

// Nachrichten zwischen Dashboard und Vorschau: ready = die Szene hört zu, settings = neue Werte für die Szene
export const PREVIEW = { ready: "rezondes-preview-ready", settings: "rezondes-preview-settings" } as const;

export function useSettings(fallback: PublicSettings): PublicSettings | null {
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  useEffect(() => {
    let active = true;
    // fetchSettings fängt Netzwerkfehler selbst ab und liefert dann null; eine SSE-Nachricht kann schneller sein
    fetchSettings()
      .then(loaded => { if (active) setSettings(current => current ?? loaded ?? fallback); })
      .catch((error: unknown) => console.warn("Loading settings failed:", error));
    const stop = connect({ settings: setSettings });
    return () => { active = false; stop(); };
  }, [fallback]);

  useEffect(() => {
    if (!params.has("preview") || parent === window) return;
    const receive = (event: MessageEvent) => {
      const data = event.data as { type?: unknown; settings?: PublicSettings } | null;
      if (event.origin === location.origin && data?.type === PREVIEW.settings && data.settings) setSettings(data.settings);
    };
    addEventListener("message", receive);
    parent.postMessage({ type: PREVIEW.ready }, location.origin);
    return () => removeEventListener("message", receive);
  }, []);

  return settings;
}

export const ThemeValues = createContext<SettingValues>({});

export const useThemeValues = () => useContext(ThemeValues);
