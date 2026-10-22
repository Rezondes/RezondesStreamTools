// Entry of the page: overlay scene (file name alerts.html under /s/<login>/ or hash #/alerts) or otherwise the
// dashboard (src/dashboard, sections in the hash like #/theme). A scene comes from the theme the streamer chose,
// with its settings as CSS variables and context; a scene the theme does not bring stays empty.
import { Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import Dashboard from "./dashboard/Dashboard.tsx";
import { applySkin, rememberedSkin } from "./dashboard/skin.ts";
import { SCENES, type SceneName } from "./core/theme.ts";
import { resolveSettings } from "./core/settings.ts";
import { cssVariables, resolveScene } from "./core/themeRuntime.ts";
import { ThemeValues, useSettings } from "./core/hooks/useSettings.ts";
import { areaOf, setSceneFrame } from "./core/sceneArea.ts";
import { STAGE } from "./core/screens/screens.ts";
import { DEFAULT_THEME, findModule, findTheme } from "./themes/registry.ts";
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
  // A scene the theme does not bring stays empty (transparent in OBS), nothing comes from another theme
  const Scene = resolveScene(THEME_SCENES, chosen.id, scene);
  if (!Scene) return null;
  // Values are always resolved, so values from the dashboard preview also end up complete and valid in the scene
  const values = resolveSettings(chosen, settings.values);
  // A scene with offset (alerts) is drawn on the stage, the source shows only its part (sceneArea.ts)
  const { offset } = areaOf(findModule(chosen.id), values, scene);
  setSceneFrame(offset ? STAGE : null);
  const crop = offset ? { position: "fixed", left: 0, top: 0, width: STAGE.width, height: STAGE.height, transform: `translate(${-offset.x}px, ${-offset.y}px)` } as const : {};
  return (
    <ThemeValues.Provider value={values}>
      <div className={`theme-root theme-${chosen.id}`} style={{ ...cssVariables(chosen, values), ...crop }}>
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
// Preview (in the dashboard frame and in its own tab): checkerboard instead of a white area behind the transparent
// overlay; only its own tab may scroll
const preview = Boolean(scene) && new URLSearchParams(location.search).has("preview");
document.body.classList.toggle("preview", preview);
document.body.classList.toggle("preview-tab", preview && parent === window);
createRoot(document.getElementById("root")!).render(scene ? <ThemedScene scene={scene} /> : <Dashboard />);
