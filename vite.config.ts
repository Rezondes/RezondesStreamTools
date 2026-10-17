import { defineConfig, type Plugin, type Rollup } from "vite";
import react from "@vitejs/plugin-react";

// base "/": scripts are absolute under /assets/, so they are also found under /s/<login>/<scene>.html
export default defineConfig({
  base: "/",
  plugins: [react(), sceneFiles()],
  server: {
    port: 5173,
    strictPort: true,
    // If the overlay server runs (Docker), npm run dev also uses its login, APIs and overlay data (/s/<login>/...).
    // "/s/" with a slash, otherwise /src/... would fall under the proxy too.
    proxy: Object.fromEntries(["/s/", "/api", "/auth", "/spotify"].map(prefix => [prefix, "http://localhost:8089"])),
  },
  preview: { port: 4173, strictPort: true },
});

// Scenes that end up as their own HTML file in dist/ (same names as the routes in src/main.tsx)
const SCENES = ["starting", "brb", "ending", "alerts", "chat", "cam", "music", "fx", "minimes", "info"];

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
