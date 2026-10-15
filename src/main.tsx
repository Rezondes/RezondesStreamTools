// Einstieg der Seite: Overlay-Szene (Dateiname alerts.html unter /s/<login>/ oder Hash #/alerts), Werkzeug
// (#/stinger, #/triggers) oder sonst das Dashboard. Eine Szene kommt aus dem Theme, das der Streamer gewählt hat,
// mit seinen Einstellungen als CSS-Variablen und Kontext; fehlende Szenen erbt das Standard-Theme.
import { Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import Home from "./scenes/Home.tsx";
import Stinger from "./scenes/Stinger.tsx";
import Triggers from "./scenes/Triggers.tsx";
import { SCENES, type SceneName } from "./core/theme.ts";
import { resolveSettings } from "./core/settings.ts";
import { cssVariables, resolveScene } from "./core/themeRuntime.ts";
import { ThemeValues, useSettings } from "./core/hooks/useSettings.ts";
import { DEFAULT_THEME, findTheme } from "./themes/registry.ts";
import { THEME_SCENES } from "./themes/scenes.tsx";

// Hash-Routing (#/alerts) für die Entwicklung; Parameter werden einmal beim Laden gelesen, darum bei Wechsel neu laden
addEventListener("hashchange", () => location.reload());

const file = location.pathname.split("/").pop()!.replace(/\.html$/, "");
const path = location.hash.replace(/^#\/?/, "").split("?")[0] || (file === "index" ? "" : file);

// Standardwerte, wenn es keine Einstellungen gibt (kein Streamer, kein Server)
const defaultSchema = findTheme(DEFAULT_THEME)!;
const DEFAULTS = { theme: DEFAULT_THEME, values: resolveSettings(defaultSchema, {}) };

function ThemedScene({ scene }: { scene: SceneName }) {
  // Erst nach dem Laden zeigen, sonst blitzen kurz die Standardwerte auf
  const settings = useSettings(DEFAULTS);
  if (!settings) return null;
  const chosen = findTheme(settings.theme) ?? defaultSchema;
  const Scene = resolveScene(THEME_SCENES, chosen.id, scene, DEFAULT_THEME);
  if (!Scene) return null;
  // Erbt die Szene vom Standard-Theme, gelten dessen Einstellungen (gleiche Schlüssel werden übernommen)
  const own = THEME_SCENES[chosen.id]?.[scene] === Scene;
  const schema = own ? chosen : defaultSchema;
  const values = own ? settings.values : resolveSettings(defaultSchema, settings.values);
  return (
    <ThemeValues.Provider value={values}>
      <div className={`theme-root theme-${schema.id}`} style={cssVariables(schema, values)}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </div>
    </ThemeValues.Provider>
  );
}

// Werkzeuge, keine OBS-Quellen: Stinger-/Banner-Renderer und Trigger-Editor
const tools: Record<string, React.ReactNode> = { stinger: <Stinger />, triggers: <Triggers /> };
const scene = SCENES.find(name => name === path);

document.body.classList.toggle("overlay", Boolean(scene));
createRoot(document.getElementById("root")!).render(scene ? <ThemedScene scene={scene} /> : tools[path] ?? <Home />);
