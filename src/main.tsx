// Entry of the page: overlay scene (file name alerts.html under /s/<login>/ or hash #/alerts) or otherwise the
// dashboard (src/dashboard, sections in the hash like #/theme). A scene comes from the theme the streamer chose,
// with its settings as CSS variables and context; missing scenes are inherited from the standard theme.
import { Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import Dashboard from "./dashboard/Dashboard.tsx";
import { applySkin, rememberedSkin } from "./dashboard/skin.ts";
import { SCENES, type SceneName } from "./core/theme.ts";
import { resolveSettings } from "./core/settings.ts";
import { cssVariables, resolveScene } from "./core/themeRuntime.ts";
import { ThemeValues, useSettings } from "./core/hooks/useSettings.ts";
import { DEFAULT_THEME, findTheme } from "./themes/registry.ts";
import { THEME_SCENES } from "./themes/scenes.tsx";

const file = location.pathname.split("/").pop()!.replace(/\.html$/, "");
const pathOf = (hash: string) => hash.replace(/^#\/?/, "").split("?")[0];
// /s/<login>/ is the public commands page (scene info)
const streamerRoot = /^\/s\/[^/]+\/?$/.test(location.pathname);
const path = pathOf(location.hash) || (streamerRoot ? "info" : file === "index" ? "" : file);

const isPage = (name: string) => (SCENES as readonly string[]).includes(name);

// Hash routing for scenes (#/alerts): parameters are read once on load, so reload when switching from or to
// a scene. The dashboard sections switch without reloading.
addEventListener("hashchange", () => { if (isPage(path) || isPage(pathOf(location.hash))) location.reload(); });

// Defaults when there are no settings (no streamer, no server)
const defaultSchema = findTheme(DEFAULT_THEME)!;
const DEFAULTS = { theme: DEFAULT_THEME, values: resolveSettings(defaultSchema, {}) };

// The commands page is a page for viewers, not an overlay: no live connection, normally scrollable
const PUBLIC_PAGES: readonly SceneName[] = ["info"];

function ThemedScene({ scene }: { scene: SceneName }) {
  // Show only after loading, otherwise the defaults flash briefly
  const settings = useSettings(DEFAULTS, !PUBLIC_PAGES.includes(scene));
  if (!settings) return null;
  const chosen = findTheme(settings.theme) ?? defaultSchema;
  const Scene = resolveScene(THEME_SCENES, chosen.id, scene, DEFAULT_THEME);
  if (!Scene) return null;
  // If the scene is inherited from the standard theme, its settings apply (equal keys are taken over).
  // Values are always resolved, so values from the dashboard preview also end up complete and valid in the scene.
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

const publicPage = scene !== undefined && PUBLIC_PAGES.includes(scene);
// Dashboard: set the skin before the first frame (the last remembered one, the account corrects it); scenes have none
if (!scene) applySkin(rememberedSkin());
document.body.classList.toggle("overlay", Boolean(scene) && !publicPage);
document.body.classList.toggle("public-page", publicPage);
// Preview in its own tab: checkerboard instead of a white area behind the transparent overlay
document.body.classList.toggle("preview-tab", Boolean(scene) && new URLSearchParams(location.search).has("preview") && parent === window);
createRoot(document.getElementById("root")!).render(scene ? <ThemedScene scene={scene} /> : <Dashboard />);
