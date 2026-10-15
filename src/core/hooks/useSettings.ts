// Hook: gewähltes Theme und Einstellungen des Streamers. Startet mit fallback (Standardwerte), lädt dann
// /s/<login>/settings und übernimmt Änderungen aus dem Dashboard sofort (SSE "settings").
// useThemeValues liest die Werte in einer Szene aus dem Kontext, den main.tsx setzt.
import { createContext, useContext, useEffect, useState } from "react";
import { connect, fetchSettings } from "../connection.ts";
import type { SettingValues } from "../theme.ts";
import type { PublicSettings } from "../types.ts";

export function useSettings(fallback: PublicSettings): PublicSettings {
  const [settings, setSettings] = useState(fallback);
  useEffect(() => {
    let active = true;
    fetchSettings()
      .then(loaded => { if (active && loaded) setSettings(loaded); })
      .catch((error: unknown) => console.warn("Loading settings failed:", error));
    const stop = connect({ settings: setSettings });
    return () => { active = false; stop(); };
  }, []);
  return settings;
}

export const ThemeValues = createContext<SettingValues>({});

export const useThemeValues = () => useContext(ThemeValues);
