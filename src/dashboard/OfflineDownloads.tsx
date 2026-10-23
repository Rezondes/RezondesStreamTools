// "Ohne Server verwenden" under OBS einrichten: Starting, BRB, Ending and the camera frame need no live data, so the
// streamer downloads them for OBS. As HTML (offlineHtml.ts: the offline build with the saved settings and media inside)
// or as a video loop recorded in this browser: the scene runs in a dialog, the tab capture of the browser films it in
// real time and a canvas turns it into WebM (with the transparency of the camera frame, keyed out of a background color,
// videoFrames.ts) and MP4 (black background). Nothing of this runs on the server.
import { useEffect, useRef, useState } from "react";
import { areaOf } from "../core/sceneArea.ts";
import { resolveSettings } from "../core/settings.ts";
import * as streamerPath from "../core/streamerPath.ts";
import type { SceneName, SettingValues } from "../core/theme.ts";
import { DEFAULT_THEME, findModule, findTheme } from "../themes/registry.ts";
import { getJson } from "./api.ts";
import type { Me } from "./navigation.ts";
import { reportError, toast } from "./notices.ts";
import { offlineFileName, offlineHtml, usedMedia } from "./offlineHtml.ts";
import { TEXTS } from "./texts.de.ts";
import { keyColorFor, keyHex, keyPixels, type Rgb, videoSeconds } from "./videoFrames.ts";

const TEXT = TEXTS.offlineScenes;
const OFFLINE_SCENES: readonly SceneName[] = ["starting", "brb", "ending", "cam"];
// fixed: frames per second of a video, its bit rate, the pause after the scene loaded (fonts, first frame) in ms
const VIDEO = { fps: 30, bits: 12_000_000, settleMs: 800 };
// fixed: loop length of a video in s: default and limits
const LOOP = { initial: 30, least: 10, most: 120 };
const SECOND_MS = 1000;
// fixed: room of the recorder dialog beside and above the scene for its padding and the controls (px)
const RECORDER_ROOM = { width: 32, height: 150 };
// fixed: the formats of the recorder; WebM with VP8 keeps the transparency of a canvas
const TYPES = { webm: "video/webm;codecs=vp8", mp4: "video/mp4;codecs=avc1" } as const;
type Format = keyof typeof TYPES;

type SettingsFile = { values: Record<string, Record<string, unknown>> };
type Recording = { scene: SceneName; seconds: number; values: SettingValues };

// Saves a blob under a file name
function save(blob: Blob, name: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), SECOND_MS);
}

async function text(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.text();
}

async function dataUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(blob);
  });
}

// The saved values of the active theme
async function savedValues(themeId: string) {
  const schema = findTheme(themeId) ?? findTheme(DEFAULT_THEME)!;
  const file = await getJson<SettingsFile | null>("/api/settings", null);
  return { schema, values: resolveSettings(schema, file?.values[schema.id]) };
}

async function downloadHtml(me: Me, scene: SceneName) {
  const { schema, values } = await savedValues(me.theme);
  const [script, style] = await Promise.all([text("/offline/offline.js"), text("/offline/offline.css")]);
  const names = usedMedia(schema.fields, values);
  const files = await Promise.all(names.map(name => dataUrl(`${streamerPath.base(me.login)}/media/${encodeURIComponent(name)}`)));
  const media = Object.fromEntries(names.map((name, index) => [name, files[index]]));
  const fonts = document.querySelector<HTMLLinkElement>('link[href^="https://fonts.googleapis.com/css2"]')?.href ?? null;
  const html = offlineHtml({ page: { scene, settings: { theme: schema.id, values }, media }, script, style, fonts, title: `${TEXTS.scenes[scene]} (${me.login})` });
  const name = offlineFileName(me.login, scene, "html");
  save(new Blob([html], { type: "text/html" }), name);
  toast(TEXT.saved(name));
}

export default function OfflineDownloads({ me }: { me: Me }) {
  const [loop, setLoop] = useState(LOOP.initial);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState<Recording | null>(null);
  const run = (what: string, action: () => Promise<void>) => {
    setBusy(true);
    action()
      .catch((failure: unknown) => reportError(TEXTS.errors["server-error"], { Aktion: what, Grund: String(failure) }))
      .finally(() => setBusy(false));
  };
  const record = (scene: SceneName) => run(`Video ${scene} vorbereiten`, async () => {
    const { values } = await savedValues(me.theme);
    setRecording({ scene, seconds: videoSeconds(scene, values, loop), values });
  });
  return (
    <>
      <p className="muted">{TEXT.intro}</p>
      <label className="setting">
        {TEXT.loop}
        <input type="number" min={LOOP.least} max={LOOP.most} value={loop} onChange={event => setLoop(Math.min(LOOP.most, Math.max(LOOP.least, Math.trunc(Number(event.target.value)) || LOOP.initial)))} />
      </label>
      <p className="muted">{TEXT.loopHint} {TEXT.formats}</p>
      <table>
        <thead><tr><th>{TEXT.scene}</th><th /></tr></thead>
        <tbody>
          {OFFLINE_SCENES.map(scene => (
            <tr key={scene}>
              <td>{TEXTS.scenes[scene]}</td>
              <td className="actions">
                <button className="btn" disabled={busy} onClick={() => run(`HTML ${scene}`, () => downloadHtml(me, scene))}>{TEXT.html}</button>
                <button className="btn" disabled={busy} onClick={() => record(scene)}>{TEXT.video}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {busy && <p role="status" className="muted">{TEXT.building}</p>}
      {recording && <Recorder me={me} recording={recording} onClose={() => setRecording(null)} />}
    </>
  );
}

// Region Capture of Chromium: crops the tab capture to one element (not in the DOM types yet)
type CropTarget = object;
type CroppableTrack = MediaStreamTrack & { cropTo?: (target: CropTarget) => Promise<void> };
const cropTargetOf = (element: Element): Promise<CropTarget> | null =>
  (globalThis as { CropTarget?: { fromElement: (element: Element) => Promise<CropTarget> } }).CropTarget?.fromElement(element) ?? null;

// The dialog with the scene at the size of its OBS source; records after the click on start
function Recorder({ me, recording, onClose }: { me: Me; recording: Recording; onClose: () => void }) {
  const { scene, seconds, values } = recording;
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [left, setLeft] = useState<number | null>(null);
  const stop = useRef<(() => void) | null>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  const { width, height } = areaOf(findModule(me.theme), values, scene);
  const scale = Math.min(1, (innerWidth - RECORDER_ROOM.width) / width, (innerHeight - RECORDER_ROOM.height) / height);
  // Only the camera frame has transparency: it is drawn on a key color
  const key = scene === "cam" ? keyColorFor(values) : null;
  const src = `${streamerPath.base(me.login)}/${scene}?key=${encodeURIComponent(me.overlayKey)}&video&sound=0${key ? `&bg=${keyHex(key)}` : ""}`;
  const start = () => {
    if (!frame.current) return;
    const what = `Video ${scene} aufnehmen`;
    filmScene({ frame: frame.current, src, size: { width, height }, key, seconds, onSecond: setLeft, onStop: cancel => { stop.current = cancel; } })
      .then(files => {
        const names = files.map(file => offlineFileName(me.login, scene, file.format));
        files.forEach((file, index) => save(file.blob, names[index]));
        toast(TEXT.recorded(names.join(", ")));
        dialog.current?.close();
      })
      .catch((failure: unknown) => {
        setLeft(null);
        reportError(failure instanceof CaptureMissing ? TEXT.noCapture : TEXTS.errors["server-error"], { Aktion: what, Grund: String(failure) });
      });
  };
  return (
    <dialog ref={dialog} className="recorder" aria-label={TEXT.recordTitle(TEXTS.scenes[scene], seconds)} onClose={() => { stop.current?.(); onClose(); }}>
      <p className="actions">
        <b>{TEXT.recordTitle(TEXTS.scenes[scene], seconds)}</b>
        {left === null ? <button className="btn primary" onClick={start}>{TEXT.recordStart}</button> : <span role="status">{TEXT.recording(left)}</span>}
        <button className="btn" onClick={() => dialog.current?.close()}>{TEXT.recordCancel}</button>
      </p>
      <p className="muted">{TEXT.recordHint}</p>
      {/* The whole scene must stay visible for the capture: smaller than the window if needed (sharpest in full screen) */}
      <div className="recorder-box" style={{ width: width * scale, height: height * scale }}>
        {/* Shown at once; the start loads it again, so the video begins with the scene */}
        <iframe ref={frame} src={src} title={TEXTS.scenes[scene]} width={width} height={height} className="recorder-frame" style={{ transform: `scale(${scale})` }} />
      </div>
    </dialog>
  );
}

class CaptureMissing extends Error {}

type Film = {
  frame: HTMLIFrameElement;
  src: string;
  size: { width: number; height: number };
  key: Rgb | null;
  seconds: number;
  onSecond: (left: number) => void;
  onStop: (cancel: () => void) => void;
};
type FilmFile = { blob: Blob; format: Format };

// Captures the tab, starts the scene, draws every captured frame into the canvases and records them for the seconds
async function filmScene({ frame, src, size, key, seconds, onSecond, onStop }: Film): Promise<FilmFile[]> {
  if (!navigator.mediaDevices?.getDisplayMedia) throw new CaptureMissing("getDisplayMedia");
  const options = { video: { displaySurface: "browser", frameRate: VIDEO.fps }, audio: false, preferCurrentTab: true, selfBrowserSurface: "include" };
  const stream = await navigator.mediaDevices.getDisplayMedia(options);
  const track = stream.getVideoTracks()[0] as CroppableTrack;
  const target = cropTargetOf(frame);
  const cropped = Boolean(target && track.cropTo);
  if (target && track.cropTo) await track.cropTo(await target);
  const video = document.createElement("video");
  video.muted = true;
  video.srcObject = stream;
  await video.play();
  await new Promise<void>(resolve => { frame.onload = () => resolve(); frame.src = src; });
  await new Promise(resolve => setTimeout(resolve, VIDEO.settleMs));
  const canvases = drawingCanvases(size, key);
  const recorders = canvases.outputs.filter(output => MediaRecorder.isTypeSupported(TYPES[output.format])).map(output => recorderOf(output.canvas, output.format));
  let timer = 0;
  const finish = () => { clearInterval(timer); recorders.forEach(recorder => { if (recorder.recorder.state !== "inactive") recorder.recorder.stop(); }); stream.getTracks().forEach(each => each.stop()); };
  onStop(finish);
  const startedAt = performance.now();
  recorders.forEach(recorder => recorder.recorder.start());
  timer = window.setInterval(() => {
    const elapsed = (performance.now() - startedAt) / SECOND_MS;
    canvases.draw(video, cropped ? null : frame.getBoundingClientRect());
    onSecond(Math.max(0, Math.ceil(seconds - elapsed)));
    if (elapsed >= seconds) finish();
  }, SECOND_MS / VIDEO.fps);
  return Promise.all(recorders.map(recorder => recorder.done));
}

// The canvases of a recording: one with the scene (keyed for transparency), for a keyed scene a second one with black
// behind it for the MP4
function drawingCanvases(size: { width: number; height: number }, key: Rgb | null) {
  const canvas = (): HTMLCanvasElement => Object.assign(document.createElement("canvas"), size);
  const scene = canvas();
  const sceneContext = scene.getContext("2d", { willReadFrequently: key !== null })!;
  const black = key ? canvas() : scene;
  const blackContext = black.getContext("2d")!;
  const draw = (video: HTMLVideoElement, area: DOMRect | null) => {
    // Without Region Capture the whole tab arrives: cut the frame out of it (CSS px times the scale of the capture)
    const scale = video.videoWidth / innerWidth;
    const from = area ? [area.left * scale, area.top * scale, area.width * scale, area.height * scale] : [0, 0, video.videoWidth, video.videoHeight];
    sceneContext.clearRect(0, 0, size.width, size.height);
    sceneContext.drawImage(video, from[0], from[1], from[2], from[3], 0, 0, size.width, size.height);
    if (!key) return;
    const pixels = sceneContext.getImageData(0, 0, size.width, size.height);
    keyPixels(pixels.data, key);
    sceneContext.putImageData(pixels, 0, 0);
    blackContext.fillStyle = "#000";
    blackContext.fillRect(0, 0, size.width, size.height);
    blackContext.drawImage(scene, 0, 0);
  };
  const outputs: { canvas: HTMLCanvasElement; format: Format }[] = [{ canvas: scene, format: "webm" }, { canvas: black, format: "mp4" }];
  return { draw, outputs };
}

function recorderOf(canvas: HTMLCanvasElement, format: Format) {
  const recorder = new MediaRecorder(canvas.captureStream(VIDEO.fps), { mimeType: TYPES[format], videoBitsPerSecond: VIDEO.bits });
  const parts: Blob[] = [];
  recorder.ondataavailable = event => parts.push(event.data);
  const done = new Promise<FilmFile>(resolve => {
    recorder.onstop = () => resolve({ blob: new Blob(parts, { type: TYPES[format] }), format });
  });
  return { recorder, done };
}
