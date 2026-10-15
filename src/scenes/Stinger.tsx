// Vorschau und Renderer für Videos/GIFs: Stinger-Übergang und Twitch-Banner. Nur im Dev-Server
// (npm run dev), weil das Rendern die Frames an das Vite-Plugin in vite.config.ts schickt, das ffmpeg aufruft.
// Auswahl per Knopf oder ?clip=stinger|profile|offline
import { useEffect, useRef, useState } from "react";
import { FPS, H, W, drawStinger, stingerOptions } from "../themes/matrix/stinger.ts";
import { bannerOptions, drawOfflineBanner, drawProfileBanner } from "../themes/matrix/banners.ts";
import { matrixSettings, type MatrixValues } from "../themes/matrix/settings.ts";
import { resolveSettings } from "../core/settings.ts";
import { params } from "../core/params.ts";

type Clip = {
  name: string;
  label: string;
  w: number;
  h: number;
  fps: number;
  duration: number;
  format: "webm" | "gif";
  draw: (ctx: CanvasRenderingContext2D, t: number) => void;
  hint: string;
};

// Standardwerte des Matrix-Themes; mit den Einstellungen eines Streamers rendert später der Server (Package 10)
const VALUES = resolveSettings(matrixSettings, {}) as unknown as MatrixValues;
const STINGER = stingerOptions(VALUES);
const BANNER = bannerOptions(VALUES, VALUES.channelName.toLowerCase());
const FONT = `24px "${VALUES.font}"`;

const CLIPS: Clip[] = [
  { name: "stinger", label: "STINGER", w: W, h: H, fps: FPS, duration: STINGER.duration, format: "webm", draw: (context, time) => drawStinger(context, time, STINGER), hint: `OBS: Übergang "Stinger", Videodatei render/stinger.webm, Übergangspunkt ${STINGER.cut * 1000} ms.` },
  { name: "profile", label: "PROFILBANNER", w: 1200, h: 480, fps: BANNER.profileFps, duration: BANNER.loop, format: "gif", draw: (context, time) => drawProfileBanner(context, time, BANNER), hint: "Twitch: Einstellungen > Kanal > Markenidentität > Profilbanner. Datei render/profile.gif (max. 10 MB), Standbild render/profile.png." },
  { name: "offline", label: "OFFLINE-BANNER", w: 1920, h: 1080, fps: BANNER.offlineFps, duration: BANNER.loop, format: "gif", draw: (context, time) => drawOfflineBanner(context, time, BANNER), hint: "Twitch: Einstellungen > Kanal > Markenidentität > Banner für Videoplayer. Datei render/offline.gif (max. 10 MB), Standbild render/offline.png." },
];

export default function Stinger() {
  const [clip, setClip] = useState(() => CLIPS.find(c => c.name === params.get("clip")) ?? CLIPS[0]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [status, setStatus] = useState("");
  const stinger = clip.name === "stinger";

  // Endlosschleife; beim Stinger mit 1 s Pause, damit man den Schnitt gut sieht
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      setT(((now - start) / 1000) % (clip.duration + (stinger ? 1 : 0)));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, clip, stinger]);

  useEffect(() => {
    document.fonts.load(FONT)
      .then(() => clip.draw(canvas.current!.getContext("2d")!, Math.min(t, clip.duration)))
      .catch((error: unknown) => console.error("Font loading failed:", error));
  }, [t, clip]);

  async function render() {
    setPlaying(false);
    await document.fonts.load(FONT);
    const ctx = canvas.current!.getContext("2d")!;
    const frames = Math.round(clip.duration * clip.fps);
    await fetch(`/__render/start`, { method: "POST" });
    for (let i = 0; i < frames; i++) {
      clip.draw(ctx, i / clip.fps);
      const png = await new Promise<Blob>(r => canvas.current!.toBlob(b => r(b!), "image/png"));
      await fetch(`/__render/frame?i=${i}`, { method: "POST", body: png });
      setStatus(`Frame ${i + 1}/${frames}`);
    }
    setStatus("Kodiere mit ffmpeg ...");
    const res = await fetch(`/__render/done?fps=${clip.fps}&name=${clip.name}&format=${clip.format}`, { method: "POST" });
    setStatus(await res.text());
    setPlaying(true);
  }

  return (
    <main className="stinger">
      <p className="actions">
        {CLIPS.map(c => (
          <button key={c.name} className={`btn${c === clip ? " primary" : ""}`} onClick={() => { setClip(c); setStatus(""); setPlaying(true); }}>[ {c.label} ]</button>
        ))}
      </p>
      <div className="stinger-view" style={{ aspectRatio: `${clip.w} / ${clip.h}` }}>
        {/* Fake-Szenen hinter dem Stinger, damit man sieht, wo geschnitten wird */}
        {stinger && <div className={`fake-scene ${t < STINGER.cut ? "a" : "b"}`}>{t < STINGER.cut ? "SZENE A" : "SZENE B"}</div>}
        <canvas key={clip.name} ref={canvas} width={clip.w} height={clip.h} />
      </div>
      <div className="stinger-bar">
        <button className="btn" onClick={() => setPlaying(p => !p)}>{playing ? "[ PAUSE ]" : "[ PLAY ]"}</button>
        <input
          type="range" min={0} max={clip.duration} step={1 / clip.fps} value={Math.min(t, clip.duration)}
          aria-label="Zeitpunkt"
          onChange={e => { setPlaying(false); setT(Number(e.target.value)); }}
        />
        <span>{Math.min(t, clip.duration).toFixed(2)} s</span>
        <button className="btn primary" onClick={render}>[ RENDERN ]</button>
        <span className="muted">{status}</span>
      </div>
      <p className="muted">{clip.hint}</p>
    </main>
  );
}
