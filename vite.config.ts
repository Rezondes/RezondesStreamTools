import { defineConfig, type Plugin, type Rollup } from "vite";
import react from "@vitejs/plugin-react";
import { spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import ffmpegPath from "ffmpeg-static";

// base "./" damit der Build auch aus einem beliebigen Ordner läuft
export default defineConfig({
  base: "./",
  plugins: [react(), stingerRender(), singleFile()],
  server: {
    port: 5173,
    strictPort: true,
    // Läuft der Overlay-Server (Docker), nutzt auch npm run dev dessen Login und Events
    proxy: Object.fromEntries(["/api", "/auth", "/events", "/media", "/spotify"].map(p => [p, "http://localhost:8089"])),
  },
  preview: { port: 4173, strictPort: true },
});

// Szenen, die als eigene HTML-Datei in dist/ landen (gleiche Namen wie die Routen in src/main.tsx)
const SCENES = ["starting", "brb", "ending", "alerts", "chat", "cam", "music", "fx"];

// Baut JS und CSS direkt ins HTML ein. Externe Module blockiert Chromium bei file://,
// eingebettete nicht. So lässt sich dist/alerts.html in OBS als "Lokale Datei" einbinden.
function singleFile(): Plugin {
  return {
    name: "single-file",
    apply: "build",
    enforce: "post",
    generateBundle(_, bundle) {
      const html = bundle["index.html"] as Rollup.OutputAsset;
      let source = String(html.source);
      for (const [name, file] of Object.entries(bundle)) {
        if (file.type === "chunk") {
          const code = file.code.replace(/<\/script/gi, "<\\/script");
          source = source.replace(new RegExp(`<script[^>]*src="[^"]*${name}"[^>]*></script>`), () => `<script type="module">${code}</script>`);
          delete bundle[name];
        } else if (name.endsWith(".css")) {
          source = source.replace(new RegExp(`<link[^>]*href="[^"]*${name}"[^>]*>`), () => `<style>${file.source}</style>`);
          delete bundle[name];
        }
      }
      html.source = source;
      for (const scene of SCENES) this.emitFile({ type: "asset", fileName: `${scene}.html`, source });
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
      server.middlewares.use("/__render", async (req, res) => {
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
        res.end();
      });
    },
  };
}
