import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, relative } from "node:path";
import { defineConfig, type Plugin, type Rollup } from "vite";
import react from "@vitejs/plugin-react";
import { BUNDLE_MAP_FILE, type BundleChunk } from "./scripts/bundle.ts";

// The offline build (vite build --mode offline): the whole page as one script with every theme, every lazy scene and
// every asset inlined, plus one stylesheet, in dist/offline/. The dashboard wraps them with the saved settings of a
// scene into a single HTML file the streamer downloads (src/dashboard/offlineHtml.ts). Without a server: no live data.
const OFFLINE = {
  mode: "offline",
  build: {
    outDir: "dist/offline",
    emptyOutDir: true,
    copyPublicDir: false,
    cssCodeSplit: false,
    // Everything inside the script: fonts, pictures and sounds the code imports (no limit)
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    lib: { entry: "src/main.tsx", formats: ["es" as const], fileName: () => "offline.js", cssFileName: "offline" },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  plugins: [react()],
};

// base "/": scripts are absolute under /assets/, so they are also found under /s/<login>/<scene>.html
export default defineConfig(({ mode }) => (mode === OFFLINE.mode ? OFFLINE : {
  base: "/",
  plugins: [react(), sceneFiles(), bundleMap()],
  server: {
    port: 5173,
    strictPort: true,
    // If the overlay server runs (Docker), npm run dev also uses its login, APIs and overlay data (/s/<login>/...).
    // "/s/" with a slash, otherwise /src/... would fall under the proxy too. The scene pages of /s/ come from the built
    // dist/ of the server and load their scripts from /assets/, so those go there as well, like the offline build under
    // /offline/. RST_PROXY points it at the
    // demo server (npm run demo), which has this dev server as its public URL, so the host stays as it is.
    proxy: Object.fromEntries(["/s/", "/assets/", "/offline/", "/api", "/auth", "/spotify"].map(prefix => [prefix, process.env.RST_PROXY ? { target: process.env.RST_PROXY, changeOrigin: false } : "http://localhost:8089"])),
  },
  preview: { port: 4173, strictPort: true },
}));

// Scenes that end up as their own HTML file in dist/ (same names as the routes in src/main.tsx)
const SCENES = ["starting", "brb", "ending", "alerts", "chat", "cam", "music", "stats", "fx", "minimes", "info"];

// One HTML file per scene (alerts.html, chat.html, ...) as a copy of index.html. The server serves them under
// /s/<login>/<scene>.html; the scripts are under /assets/, one chunk per theme.
function sceneFiles(): Plugin {
  return {
    name: "scene-files",
    apply: "build",
    enforce: "post",
    generateBundle(_, bundle) {
      const html = bundle["index.html"] as Rollup.OutputAsset;
      for (const scene of SCENES) this.emitFile({ type: "asset", fileName: `${scene}.html`, source: html.source });
    },
  };
}

// Writes which packages each chunk holds (outside dist/, read by scripts/bundle.ts in npm run verify)
function bundleMap(): Plugin {
  const packageOf = (id: string) => id.replaceAll("\\", "/").match(/node_modules\/((?:@[^/]+\/)?[^/]+)\//)?.[1] ?? null;
  return {
    name: "bundle-map",
    apply: "build",
    generateBundle(_, bundle) {
      const chunks: BundleChunk[] = Object.values(bundle).filter(output => output.type === "chunk").map(output => ({
        file: output.fileName,
        entry: output.isEntry,
        facade: output.facadeModuleId ? relative(process.cwd(), output.facadeModuleId).replaceAll("\\", "/") : null,
        imports: output.imports,
        packages: [...new Set(output.moduleIds.map(packageOf).filter(name => name !== null))].sort(),
      }));
      mkdirSync(dirname(BUNDLE_MAP_FILE), { recursive: true });
      writeFileSync(BUNDLE_MAP_FILE, JSON.stringify(chunks, null, 1));
    },
  };
}
