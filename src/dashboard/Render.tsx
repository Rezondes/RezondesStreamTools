// Render section in the dashboard: stinger (WebM with alpha) and profile and offline banners (GIF with still image) of the
// active theme (chosen in the THEME section). Next to the preview are the settings of the clip's group (stinger or banners); the
// preview shows unsaved values immediately, saving does not change the overlay theme. Rendering: the browser draws
// every frame and sends it as PNG to the server, which builds the result with ffmpeg.
import { useCallback, useEffect, useRef, useState } from "react";
import { isErrorCode, type ErrorCode } from "../core/errorCodes.ts";
import type { ClipName, RenderClip } from "../core/renderClip.ts";
import { resolveSettings, type SettingError, type SettingErrorCode } from "../core/settings.ts";
import type { SettingValues } from "../core/theme.ts";
import { DEFAULT_THEME, findTheme } from "../themes/registry.ts";
import { clipsFor } from "../themes/renderers.ts";
import { getJson, postJson } from "./api.ts";
import type { Me } from "./navigation.ts";
import SettingInput from "./SettingInput.tsx";
import { changedKeys, errorsByKey, resetField } from "./settingsForm.ts";
import { TEXTS } from "./texts.de.ts";

const RENDER_TEXT = TEXTS.render;
const SECOND_MS = 1000;
const MEGABYTE = 1024 * 1024;
// For the stinger a one-second pause after every pass, so the cut is easy to see
const STINGER_PAUSE = 1;

type SettingsFile = { theme: string; values: Record<string, Record<string, unknown>> };
type RenderedFile = { name: string; size: number };

export default function Render({ me }: { me: Me }) {
  const settings = useThemeDraft();
  const [clipName, setClipName] = useState<ClipName | null>(null);
  if (!settings.ready) return <p className="muted">{TEXTS.loading}</p>;
  const schema = findTheme(settings.theme) ?? findTheme(DEFAULT_THEME)!;
  const clips = clipsFor(schema.id, resolveSettings(schema, settings.draft), me.login).filter(clip => me.features[clip.feature]);
  const clip = clips.find(candidate => candidate.name === clipName) ?? clips[0];
  const canSave = me.features.themes === true;
  return (
    <section className="panel render">
      <p className="muted">{RENDER_TEXT.theme(schema.name)}</p>
      <p className="actions">
        {clips.map(candidate => (
          <button key={candidate.name} className={`btn${candidate === clip ? " primary" : ""}`} aria-pressed={candidate === clip} onClick={() => setClipName(candidate.name)}>
            {RENDER_TEXT.clips[candidate.name]}
          </button>
        ))}
      </p>
      <div className="settings-layout">
        <ClipSettings clip={clip} settings={settings} canSave={canSave} />
        <ClipPreview key={`${schema.id}-${clip.name}`} clip={clip} />
      </div>
      <RenderedFiles />
    </section>
  );
}

// Settings of the clip's group, with save and discard
function ClipSettings({ clip, settings, canSave }: { clip: RenderClip; settings: ThemeDraft; canSave: boolean }) {
  const schema = findTheme(settings.theme) ?? findTheme(DEFAULT_THEME)!;
  const fields = schema.fields.filter(field => field.group === clip.group);
  const changed = settings.changed.length;
  return (
    <div className="settings-groups">
      <h2>{RENDER_TEXT.settings}</h2>
      {!canSave && <p className="muted">{RENDER_TEXT.readOnly}</p>}
      <fieldset className="settings-group" disabled={!canSave}>
        <legend>{clip.group}</legend>
        {fields.map(field => (
          <SettingInput
            key={field.key}
            field={field}
            value={settings.draft[field.key]}
            error={settings.errors[field.key]}
            media={[]}
            onChange={value => settings.set(current => ({ ...current, [field.key]: value }))}
            onReset={() => settings.set(current => resetField(schema, current, field.key))}
          />
        ))}
      </fieldset>
      <p className="muted">{RENDER_TEXT.colorsHint}</p>
      {canSave && (
        <div className="actions">
          <button className="btn primary" disabled={changed === 0} onClick={settings.save}>{RENDER_TEXT.save}</button>
          <button className="btn" disabled={changed === 0} onClick={settings.discard}>{RENDER_TEXT.discard}</button>
          <span className="muted" role="status">{changed > 0 ? `${RENDER_TEXT.unsaved} ${changed}` : settings.notice === "saved" ? RENDER_TEXT.saved : ""}</span>
        </div>
      )}
      {settings.notice && settings.notice !== "saved" && <p className="error" role="alert">{TEXTS.errors[settings.notice]}</p>}
    </div>
  );
}

// Preview with timeline and rendering
function ClipPreview({ clip }: { clip: RenderClip }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const preview = usePreview(clip, canvas);
  const job = useRenderJob(clip, canvas, preview.setPlaying);
  const cut = clip.cut;
  return (
    <div className="scene-preview">
      <div className="render-view" style={{ aspectRatio: `${clip.width} / ${clip.height}` }}>
        {/* Scenes behind the stinger, so one sees where it cuts */}
        {cut !== null && <div className={`fake-scene ${preview.time < cut ? "a" : "b"}`}>{preview.time < cut ? RENDER_TEXT.sceneA : RENDER_TEXT.sceneB}</div>}
        <canvas ref={canvas} width={clip.width} height={clip.height} />
      </div>
      <div className="render-bar">
        <button className="btn" onClick={() => preview.setPlaying(value => !value)}>{preview.playing ? RENDER_TEXT.pause : RENDER_TEXT.play}</button>
        <input type="range" min={0} max={clip.duration} step={1 / clip.fps} value={Math.min(preview.time, clip.duration)} aria-label={RENDER_TEXT.time}
          onChange={event => { preview.setPlaying(false); preview.setTime(Number(event.target.value)); }} />
        <span>{Math.min(preview.time, clip.duration).toFixed(2)} {RENDER_TEXT.seconds}</span>
        <button className="btn primary" disabled={job.busy} onClick={job.render}>{RENDER_TEXT.render}</button>
        {job.canCancel && <button className="btn" onClick={job.cancel}>{RENDER_TEXT.cancel}</button>}
        <span className="muted" role="status">{job.status}</span>
      </div>
      <p className="muted">{cut !== null ? RENDER_TEXT.hints.stinger(Math.round(cut * SECOND_MS)) : RENDER_TEXT.hints[clip.name === "profile" ? "profile" : "offline"]}</p>
    </div>
  );
}

function RenderedFiles() {
  const [files, setFiles] = useState<RenderedFile[]>([]);
  useEffect(() => {
    const refresh = () => { getJson<RenderedFile[]>("/api/render/files", []).then(setFiles).catch(() => {}); };
    refresh();
    addEventListener("render-done", refresh);
    return () => removeEventListener("render-done", refresh);
  }, []);
  return (
    <div className="render-files-box">
      <h2>{RENDER_TEXT.files}</h2>
      {files.length === 0 && <p className="muted">{RENDER_TEXT.noFiles}</p>}
      <ul className="render-files">
        {files.map(file => (
          <li key={file.name}>
            <code>{file.name}</code> <span className="muted">{(file.size / MEGABYTE).toFixed(1)} MB</span>{" "}
            <a className="btn" href={`/api/render/file?name=${encodeURIComponent(file.name)}`} download={file.name}>{RENDER_TEXT.download}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

type ThemeDraft = ReturnType<typeof useThemeDraft>;

// Loads saved values of the active theme, keeps a draft, saves and discards
function useThemeDraft() {
  const [file, setFile] = useState<SettingsFile | null>(null);
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [draft, setDraft] = useState<SettingValues>({});
  const [errors, setErrors] = useState<Record<string, SettingErrorCode>>({});
  const [notice, setNotice] = useState<"saved" | ErrorCode | null>(null);

  const saved = useCallback((id: string, loaded: SettingsFile | null) => resolveSettings(findTheme(id) ?? findTheme(DEFAULT_THEME)!, loaded?.values[id]), []);
  useEffect(() => {
    // Without released themes (403) the defaults apply
    getJson<SettingsFile | null>("/api/settings", null)
      .then(loaded => {
        const id = loaded?.theme ?? DEFAULT_THEME;
        setFile(loaded);
        setTheme(id);
        setDraft(saved(id, loaded));
        setReady(true);
      })
      .catch(() => setReady(true));
  }, [saved]);

  const save = () => {
    postJson("/api/settings", { theme, values: draft, choose: false })
      .then(result => {
        if (result.ok) {
          setFile(current => ({ theme: current?.theme ?? theme, values: { ...current?.values, [theme]: draft } }));
          setErrors({});
          return setNotice("saved");
        }
        if (Array.isArray(result.data)) return setErrors(errorsByKey(result.data as SettingError[]));
        setNotice(typeof result.data === "string" && isErrorCode(result.data) ? result.data : "server-error");
      })
      .catch(() => setNotice("server-error"));
  };
  const discard = () => { setDraft(saved(theme, file)); setErrors({}); };
  return { ready, theme, draft, errors, notice, changed: changedKeys(saved(theme, file), draft), set: setDraft, save, discard };
}

// Preview: endless loop over the clip and drawing of the current point in time
function usePreview(clip: RenderClip, canvas: React.RefObject<HTMLCanvasElement | null>) {
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
  }, [playing, clip.duration, clip.cut]);
  useEffect(() => {
    document.fonts.load(clip.font)
      .then(() => { const context = canvas.current?.getContext("2d"); if (context) clip.draw(context, Math.min(time, clip.duration)); })
      .catch((error: unknown) => console.error("Font loading failed:", error));
  }, [time, clip, canvas]);
  return { time, setTime, playing, setPlaying };
}

// Rendering: start, all frames as PNG, finish; afterwards "render-done" reports the new file
function useRenderJob(clip: RenderClip, canvas: React.RefObject<HTMLCanvasElement | null>, setPlaying: (playing: boolean) => void) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  // Cancelling only works while frames are being sent; ffmpeg runs to the end afterwards
  const [canCancel, setCanCancel] = useState(false);
  const cancelled = useRef(false);
  const codeOf = async (response: Response): Promise<ErrorCode> => {
    const text = (await response.text()).trim();
    return isErrorCode(text) ? text : "server-error";
  };
  const run = async () => {
    await document.fonts.load(clip.font);
    const start = await fetch(`/api/render/start?clip=${clip.name}`, { method: "POST" });
    if (!start.ok) return setStatus(TEXTS.errors[await codeOf(start)]);
    const context = canvas.current!.getContext("2d")!;
    const total = Math.round(clip.duration * clip.fps);
    for (let index = 0; index < total; index++) {
      if (cancelled.current) {
        await fetch("/api/render/cancel", { method: "POST" });
        return setStatus(RENDER_TEXT.cancelled);
      }
      clip.draw(context, index / clip.fps);
      const png = await new Promise<Blob>(done => canvas.current!.toBlob(blob => done(blob!), "image/png"));
      const sent = await fetch(`/api/render/frame?i=${index}`, { method: "POST", body: png });
      if (!sent.ok) return setStatus(TEXTS.errors[await codeOf(sent)]);
      setStatus(RENDER_TEXT.frame(index + 1, total));
    }
    setCanCancel(false);
    setStatus(RENDER_TEXT.encoding);
    const done = await fetch(`/api/render/done?fps=${clip.fps}`, { method: "POST" });
    if (!done.ok) return setStatus(TEXTS.errors[await codeOf(done)]);
    const result = (await done.json()) as { tooLarge: boolean };
    setStatus(result.tooLarge ? RENDER_TEXT.tooLarge : RENDER_TEXT.done);
  };
  const render = () => {
    setPlaying(false);
    setBusy(true);
    cancelled.current = false;
    setCanCancel(true);
    run()
      .catch(() => setStatus(TEXTS.errors["server-error"]))
      .finally(() => { setBusy(false); setCanCancel(false); setPlaying(true); dispatchEvent(new Event("render-done")); });
  };
  const cancel = () => { cancelled.current = true; setCanCancel(false); };
  return { status, busy, canCancel, render, cancel };
}
