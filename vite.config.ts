import { defineConfig, type Plugin, type Rollup } from "vite";
import react from "@vitejs/plugin-react";

// base "/": Skripte liegen absolut unter /assets/, damit sie auch unter /s/<login>/<szene>.html gefunden werden
export default defineConfig({
  base: "/",
  plugins: [react(), sceneFiles()],
  server: {
    port: 5173,
    strictPort: true,
    // Läuft der Overlay-Server (Docker), nutzt auch npm run dev dessen Anmeldung, APIs und Overlay-Daten (/s/<login>/...).
    // "/s/" mit Schrägstrich, sonst fiele auch /src/... unter den Proxy.
    proxy: Object.fromEntries(["/s/", "/api", "/auth", "/spotify"].map(prefix => [prefix, "http://localhost:8089"])),
  },
  preview: { port: 4173, strictPort: true },
});

// Szenen, die als eigene HTML-Datei in dist/ landen (gleiche Namen wie die Routen in src/main.tsx)
const SCENES = ["starting", "brb", "ending", "alerts", "chat", "cam", "music", "fx", "minimes", "info"];

// Eine HTML-Datei je Szene (alerts.html, chat.html, ...) als Kopie von index.html. Der Server liefert sie unter
// /s/<login>/<szene>.html aus; die Skripte liegen unter /assets/, je Theme ein eigener Chunk.
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
