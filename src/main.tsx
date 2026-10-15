// Einstieg der Seite: Overlay-Szene (Dateiname alerts.html unter /s/<login>/ oder Hash #/alerts), Werkzeug
// (#/stinger) oder sonst das Dashboard (src/dashboard, Bereiche im Hash wie #/theme). Eine Szene kommt aus dem Theme, das der Streamer gewählt hat,
// mit seinen Einstellungen als CSS-Variablen und Kontext; fehlende Szenen erbt das Standard-Theme.
import { Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import Dashboard from "./dashboard/Dashboard.tsx";
import Stinger from "./scenes/Stinger.tsx";
import { SCENES, type SceneName } from "./core/theme.ts";
import { resolveSettings } from "./core/settings.ts";
import { cssVariables, resolveScene } from "./core/themeRuntime.ts";
import { ThemeValues, useSettings } from "./core/hooks/useSettings.ts";
import { DEFAULT_THEME, findTheme } from "./themes/registry.ts";
import { THEME_SCENES } from "./themes/scenes.tsx";

const file = location.pathname.split("/").pop()!.replace(/\.html$/, "");
const pathOf = (hash: string) => hash.replace(/^#\/?/, "").split("?")[0];
const path = pathOf(location.hash) || (file === "index" ? "" : file);

// Werkzeuge, keine OBS-Quellen: Stinger-/Banner-Renderer
const tools: Record<string, React.ReactNode> = { stinger: <Stinger /> };
const isPage = (name: string) => name in tools || (SCENES as readonly string[]).includes(name);

// Hash-Routing für Szenen und Werkzeuge (#/alerts): Parameter werden einmal beim Laden gelesen, darum beim Wechsel
// von oder zu einer Szene neu laden. Die Bereiche des Dashboards wechseln ohne Neuladen.
addEventListener("hashchange", () => { if (isPage(path) || isPage(pathOf(location.hash))) location.reload(); });

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
  // Erbt die Szene vom Standard-Theme, gelten dessen Einstellungen (gleiche Schlüssel werden übernommen).
  // Aufgelöst wird immer, auch Werte aus der Vorschau des Dashboards landen so vollständig und gültig in der Szene.
  const schema = THEME_SCENES[chosen.id]?.[scene] === Scene ? chosen : defaultSchema;
  const values = resolveSettings(schema, settings.values);
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

const scene = SCENES.find(name => name === path);

document.body.classList.toggle("overlay", Boolean(scene));
createRoot(document.getElementById("root")!).render(scene ? <ThemedScene scene={scene} /> : tools[path] ?? <Dashboard />);
