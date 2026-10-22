// Preview of a scene in the dashboard: the real overlay as iframe (/s/<login>/<scene>?demo&preview), scaled to
// the available space, the same URL in its own tab, or maximized in a modal over the dashboard (a margin stays free:
// a click on it or Escape closes the modal). The unsaved values go via the BroadcastChannel to all previews, on every
// change and when a scene reports "ready" (useSettings), so the maximized frame shows them as well.
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { PREVIEW } from "../core/hooks/useSettings.ts";
import * as streamerPath from "../core/streamerPath.ts";
import { SCENE_SIZES, type SceneName } from "../core/theme.ts";
import type { PublicSettings } from "../core/types.ts";
import { TEXTS } from "./texts.de.ts";

type Props = { login: string; overlayKey: string; scene: SceneName; settings: PublicSettings; available: boolean };
type Size = { width: number; height: number };

export default function ScenePreview({ login, overlayKey, scene, settings, available }: Props) {
  const [maximized, setMaximized] = useState(false);
  const size = SCENE_SIZES[scene];

  // One channel for the whole lifetime; latest holds the current values for scenes that report "ready" later
  const channel = useRef<BroadcastChannel | null>(null);
  const latest = useRef(settings);
  useEffect(() => {
    const open = new BroadcastChannel(PREVIEW.channel);
    open.onmessage = (event: MessageEvent) => {
      if ((event.data as { type?: unknown } | null)?.type === PREVIEW.ready) open.postMessage({ type: PREVIEW.settings, settings: latest.current });
    };
    channel.current = open;
    return () => open.close();
  }, []);
  useEffect(() => {
    latest.current = settings;
    channel.current?.postMessage({ type: PREVIEW.settings, settings });
  }, [settings]);

  const src = `${streamerPath.base(login)}/${scene}?demo&preview&key=${encodeURIComponent(overlayKey)}`;
  return (
    <div className="scene-preview">
      <p className="actions">
        <a className="btn" href={src} target="_blank" rel="noreferrer">{TEXTS.theme.openTab}</a>
        <button className="btn icon" disabled={!available} aria-label={TEXTS.theme.maximize} title={TEXTS.theme.maximize} onClick={() => setMaximized(true)}>
          <span aria-hidden="true">⛶</span>
        </button>
        <span className="muted">{TEXTS.theme.openTabHint}</span>
      </p>
      <ScaledScene scene={scene} src={src} size={size} available={available} style={{ aspectRatio: `${size.width} / ${size.height}`, maxWidth: size.width }} />
      {maximized && <PreviewModal scene={scene} src={src} size={size} onClose={() => setMaximized(false)} />}
    </div>
  );
}

// The scene in a box: scaled down to fit width and height, centered
function ScaledScene({ scene, src, size, available, style }: { scene: SceneName; src: string; size: Size; available: boolean; style?: CSSProperties }) {
  const [room, setRoom] = useState<Size>({ width: 0, height: 0 });
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new ResizeObserver(() => setRoom({ width: box.current?.clientWidth ?? 0, height: box.current?.clientHeight ?? 0 }));
    if (box.current) observer.observe(box.current);
    return () => observer.disconnect();
  }, []);
  const scale = room.width && room.height ? Math.min(1, room.width / size.width, room.height / size.height) : 0;
  return (
    <div ref={box} className="preview-box" style={style}>
      {/* Scene the theme does not bring: only the hint (the overlay page would stay empty); the box stays for the observer */}
      {!available && <p className="muted">{TEXTS.notInTheme}</p>}
      {available && <iframe
        key={scene}
        title={TEXTS.theme.preview}
        src={src}
        width={size.width}
        height={size.height}
        style={{ left: (room.width - size.width * scale) / 2, top: (room.height - size.height * scale) / 2, transform: `scale(${scale})` }}
      />}
    </div>
  );
}

// The maximized preview as a modal dialog: Escape, the close button or a click on the free margin (the backdrop)
// close it
function PreviewModal({ scene, src, size, onClose }: { scene: SceneName; src: string; size: Size; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog ref={dialog} className="preview-modal" aria-label={TEXTS.theme.preview} onClose={onClose} onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}>
      <button className="btn icon preview-close" aria-label={TEXTS.theme.closePreview} title={TEXTS.theme.closePreview} onClick={() => dialog.current?.close()}>
        <span aria-hidden="true">✕</span>
      </button>
      <ScaledScene scene={scene} src={src} size={size} available />
    </dialog>
  );
}
