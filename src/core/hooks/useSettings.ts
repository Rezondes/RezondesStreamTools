// Hook: gewähltes Theme und Einstellungen des Streamers. null, bis /s/<login>/settings geladen ist; ohne Streamer
// oder Server gilt fallback (Standardwerte). Änderungen aus dem Dashboard kommen sofort an (SSE "settings").
// Mit ?preview (Vorschau im Dashboard, als iframe oder im eigenen Tab) kommen ungespeicherte Werte über einen
// BroadcastChannel, den nur Seiten derselben Herkunft im selben Browser erreichen.
// useThemeValues liest die Werte in einer Szene aus dem Kontext, den main.tsx setzt.
import { createContext, useContext, useEffect, useState } from "react";
import { connect, fetchSettings } from "../connection.ts";
import { params } from "../params.ts";
import type { SettingValues } from "../theme.ts";
import type { PublicSettings } from "../types.ts";

// Kanal zwischen Dashboard und Vorschau: ready = eine Szene hört zu, settings = neue Werte für die Szenen
export const PREVIEW = { channel: "rezondes-preview", ready: "ready", settings: "settings" } as const;

// live: false = nur einmal laden, keine SSE-Verbindung (öffentliche Befehlsseite: Besucher sind keine Overlays)
export function useSettings(fallback: PublicSettings, live = true): PublicSettings | null {
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  useEffect(() => {
    let active = true;
    // fetchSettings fängt Netzwerkfehler selbst ab und liefert dann null; eine SSE-Nachricht kann schneller sein
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
