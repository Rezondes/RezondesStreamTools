// Hook: gewähltes Theme und Einstellungen des Streamers. null, bis /s/<login>/settings geladen ist; ohne Streamer
// oder Server gilt fallback (Standardwerte). Änderungen aus dem Dashboard kommen sofort an (SSE "settings").
// useThemeValues liest die Werte in einer Szene aus dem Kontext, den main.tsx setzt.
import { createContext, useContext, useEffect, useState } from "react";
import { connect, fetchSettings } from "../connection.ts";
import type { SettingValues } from "../theme.ts";
import type { PublicSettings } from "../types.ts";

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
  return settings;
}

export const ThemeValues = createContext<SettingValues>({});

export const useThemeValues = () => useContext(ThemeValues);
