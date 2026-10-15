// Render-Bereich im Dashboard: Stinger (WebM mit Alpha) sowie Profil- und Offline-Banner (GIF mit Standbild) mit den
// gespeicherten Einstellungen des Streamers. Vorschau mit Zeitleiste; Rendern schickt jeden Frame als PNG an den
// Server, der mit ffmpeg das Ergebnis baut (server/render.ts). Fertige Dateien zum Herunterladen.
import { useCallback, useEffect, useRef, useState } from "react";
import { isErrorCode, type ErrorCode } from "../core/errorCodes.ts";
import { resolveSettings } from "../core/settings.ts";
import { bannerOptions, drawOfflineBanner, drawProfileBanner } from "../themes/matrix/banners.ts";
import { matrixSettings, type MatrixValues } from "../themes/matrix/settings.ts";
import { drawStinger, FPS, HEIGHT, stingerOptions, WIDTH } from "../themes/matrix/stinger.ts";
import { getJson } from "./api.ts";
import type { Me } from "./navigation.ts";
import { TEXTS } from "./texts.de.ts";

const RENDER_TEXT = TEXTS.render;
const SECOND_MS = 1000;
const MEGABYTE = 1024 * 1024;
// Beim Stinger eine Sekunde Pause nach jedem Durchlauf, damit man den Schnitt gut sieht
const STINGER_PAUSE = 1;

type Clip = {
  name: "stinger" | "profile" | "offline";
  feature: "stinger" | "banners";
  width: number;
  height: number;
  fps: number;
  duration: number;
  cut: number | null; // Übergangspunkt in s, nur beim Stinger
  draw: (context: CanvasRenderingContext2D, time: number) => void;
};
type SettingsFile = { values: Record<string, Record<string, unknown>> };
type RenderedFile = { name: string; size: number };

function clipsFor(values: MatrixValues, login: string): Clip[] {
  const stinger = stingerOptions(values);
  const banner = bannerOptions(values, login);
  return [
    { name: "stinger", feature: "stinger", width: WIDTH, height: HEIGHT, fps: FPS, duration: stinger.duration, cut: stinger.cut, draw: (context, time) => drawStinger(context, time, stinger) },
    { name: "profile", feature: "banners", width: 1200, height: 480, fps: banner.profileFps, duration: banner.loop, cut: null, draw: (context, time) => drawProfileBanner(context, time, banner) },
    { name: "offline", feature: "banners", width: 1920, height: 1080, fps: banner.offlineFps, duration: banner.loop, cut: null, draw: (context, time) => drawOfflineBanner(context, time, banner) },
  ];
}

export default function Render({ me }: { me: Me }) {
  const [values, setValues] = useState<MatrixValues | null>(null);
  useEffect(() => {
    // Ohne freigegebene Themes (403) gelten die Standardwerte
    getJson<SettingsFile | null>("/api/settings", null)
      .then(file => setValues(resolveSettings(matrixSettings, file?.values.matrix) as unknown as MatrixValues))
      .catch((error: unknown) => console.warn("Loading settings failed:", error));
  }, []);
  if (!values) return <p className="muted">{TEXTS.loading}</p>;
  const clips = clipsFor(values, me.login).filter(clip => me.features[clip.feature]);
  return <RenderPanel clips={clips} font={`24px "${values.font}"`} />;
}

function RenderPanel({ clips, font }: { clips: Clip[]; font: string }) {
  const [clip, setClip] = useState(clips[0]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const preview = usePreview(clip, canvas, font);
  const job = useRenderJob(clip, canvas, font, preview.setPlaying);
  const cut = clip.cut;
  return (
    <section className="panel render">
      <p className="actions">
        {clips.map(candidate => (
          <button key={candidate.name} className={`btn${candidate === clip ? " primary" : ""}`} onClick={() => { setClip(candidate); preview.setPlaying(true); }}>
            {RENDER_TEXT.clips[candidate.name]}
          </button>
        ))}
      </p>
      <div className="render-view" style={{ aspectRatio: `${clip.width} / ${clip.height}` }}>
        {/* Szenen hinter dem Stinger, damit man sieht, wo geschnitten wird */}
        {cut !== null && <div className={`fake-scene ${preview.time < cut ? "a" : "b"}`}>{preview.time < cut ? RENDER_TEXT.sceneA : RENDER_TEXT.sceneB}</div>}
        <canvas key={clip.name} ref={canvas} width={clip.width} height={clip.height} />
      </div>
      <div className="render-bar">
        <button className="btn" onClick={() => preview.setPlaying(value => !value)}>{preview.playing ? RENDER_TEXT.pause : RENDER_TEXT.play}</button>
        <input type="range" min={0} max={clip.duration} step={1 / clip.fps} value={Math.min(preview.time, clip.duration)} aria-label={RENDER_TEXT.time}
          onChange={event => { preview.setPlaying(false); preview.setTime(Number(event.target.value)); }} />
        <span>{Math.min(preview.time, clip.duration).toFixed(2)} {RENDER_TEXT.seconds}</span>
        <button className="btn primary" disabled={job.busy} onClick={job.render}>{RENDER_TEXT.render}</button>
        <span className="muted" role="status">{job.status}</span>
      </div>
      <p className="muted">{cut !== null ? RENDER_TEXT.hints.stinger(Math.round(cut * SECOND_MS)) : RENDER_TEXT.hints[clip.name === "profile" ? "profile" : "offline"]}</p>
      <p className="muted">{RENDER_TEXT.settingsHint}</p>
      <h2>{RENDER_TEXT.files}</h2>
      {job.files.length === 0 && <p className="muted">{RENDER_TEXT.noFiles}</p>}
      <ul className="render-files">
        {job.files.map(file => (
          <li key={file.name}>
            <code>{file.name}</code> <span className="muted">{(file.size / MEGABYTE).toFixed(1)} MB</span>{" "}
            <a className="btn" href={`/api/render/file?name=${encodeURIComponent(file.name)}`} download={file.name}>{RENDER_TEXT.download}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Vorschau: Endlosschleife über den Clip und Zeichnen des aktuellen Zeitpunkts
function usePreview(clip: Clip, canvas: React.RefObject<HTMLCanvasElement | null>, font: string) {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const start = performance.now();
    const loop = (now: number) => {
      setTime(((now - start) / SECOND_MS) % (clip.duration + (clip.cut !== null ? STINGER_PAUSE : 0)));
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [playing, clip]);
  useEffect(() => {
    document.fonts.load(font)
      .then(() => { const context = canvas.current?.getContext("2d"); if (context) clip.draw(context, Math.min(time, clip.duration)); })
      .catch((error: unknown) => console.error("Font loading failed:", error));
  }, [time, clip, canvas, font]);
  return { time, setTime, playing, setPlaying };
}

// Rendern: Start, alle Frames als PNG, Fertigstellen; danach die Liste der fertigen Dateien neu laden
function useRenderJob(clip: Clip, canvas: React.RefObject<HTMLCanvasElement | null>, font: string, setPlaying: (playing: boolean) => void) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<RenderedFile[]>([]);
  const refresh = useCallback(() => { getJson<RenderedFile[]>("/api/render/files", []).then(setFiles).catch(() => {}); }, []);
  useEffect(refresh, [refresh]);

  const codeOf = async (response: Response): Promise<ErrorCode> => {
    const text = (await response.text()).trim();
    return isErrorCode(text) ? text : "server-error";
  };
  const run = async () => {
    await document.fonts.load(font);
    const start = await fetch(`/api/render/start?clip=${clip.name}`, { method: "POST" });
    if (!start.ok) return setStatus(TEXTS.errors[await codeOf(start)]);
    const context = canvas.current!.getContext("2d")!;
    const total = Math.round(clip.duration * clip.fps);
    for (let index = 0; index < total; index++) {
      clip.draw(context, index / clip.fps);
      const png = await new Promise<Blob>(done => canvas.current!.toBlob(blob => done(blob!), "image/png"));
      const sent = await fetch(`/api/render/frame?i=${index}`, { method: "POST", body: png });
      if (!sent.ok) return setStatus(TEXTS.errors[await codeOf(sent)]);
      setStatus(RENDER_TEXT.frame(index + 1, total));
    }
    setStatus(RENDER_TEXT.encoding);
    const done = await fetch(`/api/render/done?fps=${clip.fps}`, { method: "POST" });
    if (!done.ok) return setStatus(TEXTS.errors[await codeOf(done)]);
    const result = (await done.json()) as { tooLarge: boolean };
    setStatus(result.tooLarge ? RENDER_TEXT.tooLarge : RENDER_TEXT.done);
  };
  const render = () => {
    setPlaying(false);
    setBusy(true);
    run()
      .catch(() => setStatus(TEXTS.errors["server-error"]))
      .finally(() => { setBusy(false); setPlaying(true); refresh(); });
  };
  return { status, busy, files, render };
}
