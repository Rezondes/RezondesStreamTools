import { defineConfig, type Plugin, type Rollup } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import react from "@vitejs/plugin-react";
import { spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import ffmpegPath from "ffmpeg-static";

// base "/": Skripte liegen absolut unter /assets/, damit sie auch unter /s/<login>/<szene>.html gefunden werden
export default defineConfig({
  base: "/",
  plugins: [react(), stingerRender(), sceneFiles()],
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
const SCENES = ["starting", "brb", "ending", "alerts", "chat", "cam", "music", "fx"];

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

// Nimmt die PNG-Frames der Stinger-Seite entgegen und baut daraus mit ffmpeg
// ein WebM (VP9 mit Alpha-Kanal), das OBS direkt als Stinger-Übergang abspielt.
function stingerRender(): Plugin {
  const frames = "render/frames";
  const out = "render/stinger.webm";
  return {
    name: "stinger-render",
    configureServer(server) {
      const handleRender = async (req: IncomingMessage, res: ServerResponse): Promise<unknown> => {
        const url = new URL(req.url ?? "/", "http://localhost");
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);

        if (url.pathname === "/start") {
          rmSync(frames, { recursive: true, force: true });
          mkdirSync(frames, { recursive: true });
          return res.end("ok");
        }
        if (url.pathname === "/frame") {
          const i = Number(url.searchParams.get("i"));
          if (!Number.isInteger(i) || i < 0 || i > 9999) return (res.statusCode = 400), res.end("bad frame");
          writeFileSync(`${frames}/${String(i).padStart(4, "0")}.png`, Buffer.concat(chunks));
          return res.end("ok");
        }
        if (url.pathname === "/done") {
          const fps = Number(url.searchParams.get("fps")) || 60;
          const name = url.searchParams.get("name") ?? "stinger";
          const format = url.searchParams.get("format") === "gif" ? "gif" : "webm";
          if (!/^[a-z]+$/.test(name)) return (res.statusCode = 400), res.end("bad name");
          if (!ffmpegPath || !existsSync(ffmpegPath)) return res.end("ffmpeg fehlt: npm install-scripts approve ffmpeg-static && npm rebuild ffmpeg-static");
          const target = format === "gif" ? `render/${name}.gif` : name === "stinger" ? out : `render/${name}.webm`;
          const input = ["-y", "-framerate", String(fps), "-i", `${frames}/%04d.png`];
          const args = format === "gif"
            // GIF: eigene Palette aus allen Frames, nur geänderte Bildbereiche speichern, Endlosschleife
            ? [...input, "-filter_complex", "[0:v]split[a][b];[a]palettegen=max_colors=64:stats_mode=full[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle", "-loop", "0", target]
            : [...input, "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "20", "-auto-alt-ref", "0", "-row-mt", "1", target];
          // Standbild für Stellen, an denen Twitch kein animiertes GIF zeigt
          if (format === "gif") copyFileSync(`${frames}/0000.png`, `render/${name}.png`);
          const ff = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
          let log = "";
          ff.stderr.on("data", d => (log = (log + d).slice(-2000)));
          ff.on("close", code => res.end(code === 0
            ? `Fertig: ${target} (${(statSync(target).size / 1024 / 1024).toFixed(1)} MB)`
            : `ffmpeg Fehler ${code}: ${log}`));
          return;
        }
        res.statusCode = 404;
        return res.end();
      };
      server.middlewares.use("/__render", (req, res) => {
        handleRender(req, res).catch((error: unknown) => { res.statusCode = 500; res.end(String(error)); });
      });
    },
  };
}
