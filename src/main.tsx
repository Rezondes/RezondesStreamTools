// Einstieg der Seite: Overlay-Szene (Dateiname alerts.html unter /s/<login>/ oder Hash #/alerts), Werkzeug
// (#/stinger, #/triggers) oder sonst das Dashboard. Eine Szene kommt aus dem Theme, das der Streamer gewählt hat,
// mit seinen Einstellungen als CSS-Variablen und Kontext; fehlende Szenen erbt das Standard-Theme.
import { Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import Home from "./scenes/Home.tsx";
import Stinger from "./scenes/Stinger.tsx";
import Triggers from "./scenes/Triggers.tsx";
import { SCENES } from "./core/theme.ts";
import { resolveSettings } from "./core/settings.ts";
import { cssVariables, resolveScene } from "./core/themeRuntime.ts";
import { ThemeValues, useSettings } from "./core/hooks/useSettings.ts";
import { DEFAULT_THEME, findTheme } from "./themes/registry.ts";
import { THEME_SCENES } from "./themes/scenes.tsx";

// Hash-Routing (#/alerts) für die Entwicklung; Parameter werden einmal beim Laden gelesen, darum bei Wechsel neu laden
addEventListener("hashchange", () => location.reload());

const file = location.pathname.split("/").pop()!.replace(/\.html$/, "");
const path = location.hash.replace(/^#\/?/, "").split("?")[0] || (file === "index" ? "" : file);

// Standardwerte, bis die Einstellungen des Streamers geladen sind (und ohne Server)
const defaultSchema = findTheme(DEFAULT_THEME)!;
const DEFAULTS = { theme: DEFAULT_THEME, values: resolveSettings(defaultSchema, {}) };

function ThemedScene({ scene }: { scene: string }) {
  const settings = useSettings(DEFAULTS);
  const schema = findTheme(settings.theme) ?? defaultSchema;
  const Scene = resolveScene(THEME_SCENES, schema.id, scene, DEFAULT_THEME);
  if (!Scene) return null;
  return (
    <ThemeValues.Provider value={settings.values}>
      <div className={`theme-root theme-${schema.id}`} style={cssVariables(schema, settings.values)}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </div>
    </ThemeValues.Provider>
  );
}

// Werkzeuge, keine OBS-Quellen: Stinger-/Banner-Renderer und Trigger-Editor
const tools: Record<string, React.ReactNode> = { stinger: <Stinger />, triggers: <Triggers /> };
const isScene = (SCENES as readonly string[]).includes(path);

document.body.classList.toggle("overlay", isScene);
createRoot(document.getElementById("root")!).render(isScene ? <ThemedScene scene={path} /> : tools[path] ?? <Home />);
